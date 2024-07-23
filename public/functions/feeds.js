import fetch_threads from "../api/fetch_threads.js" ; 


const feeds = document.getElementById('feeds');


renderThreads();


async function renderThreads() {
    const threads = await fetch_threads();

    threads.forEach(thread => {
        const { author, question, created_at, likes, replies_count, id } = thread;

        const newThread = `<div class="card">
                <div class="card__left">
                    <p id="asked_by" class="asked_by">${author} asked:</p>
                    <p id="question" class="question">${question}</p>
                    <p id="timestamp" class="timestamp">Posted on: ${created_at}</p>
                    <div class="card__left_reacts">
                        <div class="likes card__left_reacts__react">
                            <div class="likes_img react_image">
                                <img src="../images/heart_icon.png" alt="heart">
                            </div>
                            <p id="like_count" class="like_counts react_counts">${likes}</p>
                        </div>
                        <div class="replies card__left_reacts__react">
                            <div class="replies_img react_image">
                                <img src="../images/replies_icon.png" alt="replies">
                            </div>
                            <p id="reply_count" class="reply_counts react_counts">${replies_count}</p>
                        </div>
                    </div>
                </div>
                <div class="card__right">
                    <a class="view_button" id="thread_view_link" href="/feed?id=${id}">View</a>
                </div>`

        feeds.insertAdjacentHTML('afterbegin', newThread);
    });
}
