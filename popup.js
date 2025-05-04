let isRunning = false;
let unfollowCount = 0;

document.getElementById('startBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url.includes('instagram.com')) {
        if(isRunning) return;
        isRunning = true;
        unfollowCount = 0;
        document.getElementById('status').textContent = 'Processing...';
        
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: async () => {
                let stop = false;
                let unfollowCount = 0;

                async function delay(ms) {
                    return new Promise(res => setTimeout(res, ms));
                }

                function getScrollContainer() {
                    const dialogs = [...document.querySelectorAll('div[role="dialog"]')];
                    for(const d of dialogs) {
                        const scrollArea = d.querySelector('div[style*="overflow: auto"]');
                        if(scrollArea && scrollArea.scrollHeight > scrollArea.clientHeight) return scrollArea;
                    }
                    return null;
                }

                async function randomScroll() {
                    const scrollContainer = getScrollContainer();
                    if(scrollContainer) {
                        const totalScroll = Math.floor(Math.random() * 800) + 500;
                        const step = 10;
                        let scrolled = 0;
                        while(scrolled < totalScroll && !stop) {
                            scrollContainer.scrollBy(0, step);
                            scrolled += step;
                            await delay(Math.floor(Math.random() * 30) + 20);
                        }
                    }
                }

                async function startUnfollowing() {
                    while(!stop) {
                        await randomScroll();
                        if(stop) break;

                        const buttons = [...document.querySelectorAll('button')].filter(b => {
                            const buttonText = b.innerText.trim().toLowerCase();
                            return buttonText === 'following' || 
                                   buttonText === 'متابَع' ||
                                   buttonText === 'متابع' ||
                                   b.getAttribute('aria-label')?.toLowerCase().includes('following') ||
                                   b.getAttribute('aria-label')?.includes('متابع');
                        });

                        if(buttons.length === 0) {
                            chrome.runtime.sendMessage({ type: 'updateStatus', text: 'Completed!' });
                            chrome.runtime.sendMessage({ type: 'updateTimer', text: 'Waiting...' });
                            break;
                        }

                        const randomIndex = Math.floor(Math.random() * buttons.length);
                        const btn = buttons[randomIndex];
                        if(stop) break;
                        
                        btn.scrollIntoView({behavior: 'smooth', block: 'center'});
                        await delay(1000);
                        if(stop) break;
                        
                        btn.click();
                        await delay(1000);
                        if(stop) break;

                        const confirm = [...document.querySelectorAll('button')].find(b => {
                            const buttonText = b.innerText.trim().toLowerCase();
                            return buttonText === 'unfollow' || 
                                   buttonText === 'إلغاء المتابعة' ||
                                   b.getAttribute('aria-label')?.toLowerCase().includes('unfollow') ||
                                   b.getAttribute('aria-label')?.includes('إلغاء المتابعة');
                        });

                        if(confirm && !stop) {
                            confirm.click();
                            unfollowCount++;
                            chrome.runtime.sendMessage({ 
                                type: 'updateStatus', 
                                text: `Unfollowed: ${unfollowCount}` 
                            });
                            
                            const randomWait = Math.floor(Math.random() * 20000) + 20000; // 20-40 seconds
                            let timeLeft = Math.floor(randomWait / 1000);
                            
                            while(timeLeft > 0 && !stop) {
                                chrome.runtime.sendMessage({ 
                                    type: 'updateTimer', 
                                    text: `Next in: ${timeLeft}s` 
                                });
                                await delay(1000);
                                timeLeft--;
                            }
                            if(stop) break;
                        }
                    }
                }

                startUnfollowing();

                window.addEventListener('message', (event) => {
                    if(event.data === 'STOP_UNFOLLOWING') {
                        stop = true;
                    }
                });
            }
        });

        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'updateStatus') {
                document.getElementById('status').textContent = message.text;
            } else if (message.type === 'updateTimer') {
                document.getElementById('timer').textContent = message.text;
            }
        });

    } else {
        document.getElementById('status').textContent = 'Please open Instagram first!';
    }
});

document.getElementById('stopBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url.includes('instagram.com')) {
        isRunning = false;
        document.getElementById('status').textContent = 'Stopped';
        document.getElementById('timer').textContent = 'Waiting...';
        
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                window.postMessage('STOP_UNFOLLOWING', '*');
                window.stop = true;
            }
        });
    }
});