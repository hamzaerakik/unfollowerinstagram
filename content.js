let stop = false;
let unfollowCount = 0;
const MAX_UNFOLLOWS = 300; 

async function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}


async function startUnfollowing() {
    for(let i = 0; i < MAX_UNFOLLOWS; i++) {
        if(stop) break;
        await randomScroll();
        const waitAfterScroll = Math.floor(Math.random() * 3000) + 3000;
        await delay(waitAfterScroll);

        const buttons = [...document.querySelectorAll('button')].filter(b => {
            const buttonText = b.innerText.trim().toLowerCase();
            return buttonText === 'following' || 
                   b.getAttribute('aria-label')?.toLowerCase().includes('following');
        });

        if(buttons.length === 0) {
            chrome.runtime.sendMessage({ 
                type: 'updateStatus', 
                text: 'Completed!' 
            });
            window.location.href = 'https://www.instagram.com/';
            break;
        }

        const randomIndex = Math.floor(Math.random() * buttons.length);
        const btn = buttons[randomIndex];
        btn.scrollIntoView({behavior: 'smooth', block: 'center'});
        await delay(1000);
        btn.click();
        await delay(1000);

        const confirm = [...document.querySelectorAll('button')].find(b => {
            const buttonText = b.innerText.trim().toLowerCase();
            return buttonText === 'unfollow' || 
                   b.getAttribute('aria-label')?.toLowerCase().includes('unfollow');
        });

        if(confirm) {
            confirm.click();
            unfollowCount++;
            
            if(unfollowCount >= MAX_UNFOLLOWS) {
                chrome.runtime.sendMessage({ 
                    type: 'updateStatus', 
                    text: `Reached maximum limit (${MAX_UNFOLLOWS})!` 
                });
                
                window.location.href = 'https://www.instagram.com/';
                stop = true;
                break;
            }
            
            chrome.runtime.sendMessage({ 
                type: 'updateStatus', 
                text: `Unfollowed: ${unfollowCount}/${MAX_UNFOLLOWS}` 
            });
        }

        const randomWait = Math.floor(Math.random() * 15000) + 10000;
        await startTimer(randomWait);
    }
}

startUnfollowing();