import getRepliesByThreadId from '../api/fetchThreadRepliesById.js';

const reply_form = document.getElementById('reply_form');
const reply_input = document.getElementById('reply_input');
const socket = io();

reply_form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const thread_id = new URLSearchParams(window.location.search).get('id');
    const user_id = localStorage.getItem('userId');

    const content = reply_input.value;

    const response = await fetch(`/api/thread_reply?threadId = ${thread_id} & userId = ${user_id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ thread_id, user_id, content}),
    });

    if (response.status === 200) {
        // window.location.reload();
        // console.log('success')
    } else {
        console.log('Failed to send reply');
    }
    
});

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('new_thread_reply', async (data) => {

    const {author, likes, content} = data;

    try {
        reply_input.value = ``;
        replies_section.innerHTML += `
                <div class="reply_wrapper">
                    <div class="reply">
                        <div class="reply_meta_data">
                            <p class="reply_meta_data_content">${author} replied,</p>
                            <p class="reply_meta_data_content like_count">Likes: ${likes}</p>
                        </div>
                        <p class="reply_content">${content}</p>
                    </div>
                </div>`;
        replies_section.scrollTo({
            top: replies_section.scrollHeight,
            behavior: 'smooth'
        });
    } catch (error) {
        console.log(error)
    }

});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});