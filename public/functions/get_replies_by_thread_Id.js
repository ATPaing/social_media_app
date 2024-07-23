import getRepliesByThreadId from '../api/fetchThreadRepliesById.js';

const replies_section = document.getElementById('replies_section');
const question_wrapper = document.getElementById('question-wrapper');

const threadId = new URLSearchParams(window.location.search).get('id');

const data = await getRepliesByThreadId(threadId);

const thread = data.threads
const replies = data.replies

if (thread) {

    const { question, askedBy, created_at, thread_likes, replies_count, is_solved } = thread;
    question_wrapper.innerHTML += `
            <div class="question_meta_data">
                <p class="question_meta_data_content">By ${askedBy},</p>
                <p class="question_meta_data_content">${created_at}</p>
            </div>
            <p class="question">${question}</p>`;
} else {
    question_wrapper.innerHTML += `<p>Thread not found</p>`;
}

if (replies.length > 0) {
    replies.forEach(reply => {
        const { author, content, likes } = reply;

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
    
    });
} else if(replies.length == 0)  {
    replies_section.innerHTML += `<p>No replies yet</p>`;
}
