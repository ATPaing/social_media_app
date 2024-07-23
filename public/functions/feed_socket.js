
const addThreadBtn = document.getElementById('add_thread');
const threadDialog = document.getElementById('threadDialog');
const threadForm = document.getElementById('threadForm');
const cancelBtn = document.getElementById('cancel_button');
const thread_ask_input = document.getElementById('thread_ask_input');

const socket = io();

// Now you can start using socket.io functionalities
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('update thread list', (data) => {
    const {question, author, likes, replies_count, is_solved, created_at, id} = data;
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
    feeds.scrollTo({
        top: 0,
        bejavior: 'smooth'
    })
})

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});


addThreadBtn.addEventListener('click', () => {
    threadDialog.showModal();
});

threadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Handle thread addition logic here
    const question = thread_ask_input.value;
    const userId = localStorage.getItem('userId');
    const likes = 0;
    const replies_count = 0;
    const is_solved = false;

    const data = { 
        question: question,
        author_id: userId,
        likes: likes,
        replies_count: replies_count,
        is_solved: is_solved
    }
    const req = await fetch('/api/send_thread', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const res = await req.json();

    if (res.message === 'Thread created successfully') {
        
        const newData = {
            ...data,
            id: res.id,
        }

        socket.emit('new_thread', newData);
        thread_ask_input.value = '';
        threadDialog.close();
    }

});

threadDialog.addEventListener('click', (event) => {
    if (event.target === threadDialog) {
        threadDialog.close();
    }
});

cancelBtn.addEventListener('click', () => {
    threadDialog.close();
})
