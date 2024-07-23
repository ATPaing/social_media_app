const body = document.querySelector('body');
const friend_list = document.getElementById('friend-list');
const search_friend_input = document.getElementById('search-friend-input');
const friend_list_dropdown = document.getElementById('friend-list-dropdown');

const chat_input = document.getElementById('chat_input');
const chat_input_form = document.getElementById('chat_input_form');

const chat_display = document.getElementById('chat_display');

let friends = []; // Store the list of friends for searching
let allUsers = []; // Store all users for adding friends

const id = localStorage.getItem('userId');

const socket = io("");

let username = '';
let room = '';
let receiver = '';

socket.on('connect', () => {
    // socket.join('')
    console.log('Connected to server');
    console.log(socket)

});

socket.on('receive_message', (data) => {

    const { message, room, sender, receiver } = data;
    console.log('Message received:', message, room, sender, receiver);
    // Add logic to display the message in the chat
    console.log(sender === username)
    chat_display.innerHTML += `
                            ${sender === username ?
                            `
                            <div class="chat_message_me chat_message">
                                <p class="message_who message_who_you">You:</p>
                                <p class="message_what">${message}</p>
                            </div>                    
                            `
                            :
                            `
                            <div class="chat_message_other chat_message">
                                <p class="message_who">From ${sender}:</p>
                                <p class="message_what">${message}</p>
                            </div>
                            `
                            }`

});


document.addEventListener('DOMContentLoaded', async () => {
    try {
        friends = await getFriendList(id); // Fetch friends and store in global array
        generateFriends(friends); // Generate the full list for display
        allUsers = await getAllUsers();
        username = await getUserNameById(id);// Fetch all users for adding friends
    } catch (error) {
        console.error('Failed to fetch friends:', error);
        friend_list.innerHTML = '<p>Failed to load friends</p>';
    }
});

chat_input_form.addEventListener('submit', (event) => {
    event.preventDefault();

    const message = chat_input.value;

    if (message.trim() === '') {
        return;
    }

    const sender = username;
    console.log(message, room, sender, receiver )
    socket.emit('send_message', { message, room, sender, receiver });
    chat_input.value = '';
});

body.addEventListener('click', (event) => {
    if (event.target.id !== 'search-friend-input') {
        friend_list_dropdown.innerHTML = ''; // Clear dropdown if clicked outside
    }
});

async function getUserNameById(id) {
    const res = await fetch(`/api/get_usernameById?id=${id}`);
    const data = await res.json();

    if (res.status === 200) {
        return data.username;
    } else {
        throw new Error(data.message);
    }

}

async function getAllUsers() {
    const res = await fetch('/api/get_all_users');
    const data = await res.json();

    if (res.status === 200) {
        return data;
    } else {
        throw new Error(data.message);
    }
}

// Debounced search function
const debouncedSearch = debounce(searchFriends, 300);

search_friend_input.addEventListener('input', (event) => {
    debouncedSearch(event.target.value);
});

function searchFriends(query) {
    if (query.length === 0) {
        friend_list_dropdown.innerHTML = ''; // Clear dropdown if query is empty
        return;
    }

    // Create a Set of usernames for already friends
    const friendsUsernames = new Set(friends.map(friend => friend.username.toLowerCase()));

    // Filter and format the search results
    const filteredFriends = allUsers
        .filter(friend => 
            friend.username.toLowerCase().startsWith(query.toLowerCase())
        )
        .map(friend => {
            // Add a status text if the user is already a friend
            const isFriend = friendsUsernames.has(friend.username.toLowerCase());
            return {
                ...friend,
                status: isFriend ? 'Already a friend' : ''
            };
        });

    // Ensure uniqueness of the search results
    const uniqueFriends = Array.from(new Set(filteredFriends.map(friend => friend.username)))
        .map(username => filteredFriends.find(friend => friend.username === username));

    if (uniqueFriends.length === 0) {
        friend_list_dropdown.innerHTML = '<p class="fri_not_found">No friends found</p>';
    } else {
        friend_list_dropdown.innerHTML = uniqueFriends.map(friend => 
            `<p class="fri_searched">
                <span class="actual_name">${highlightText(friend.username, query)}</span>
                ${friend.status ? `<span class="status">${friend.status}</span>` : ''}
            </p>`
        ).join('');
        addClickFunctionToFriSearched();
    }
}




function addClickFunctionToFriSearched() {
    const fri_searched = document.getElementsByClassName('fri_searched');
    for (const el of fri_searched) {
        el.addEventListener('click', async () => {
            const actualNameElement = el.querySelector('.actual_name');
            const friend_name = actualNameElement.textContent.trim(); // Get friend name
            const friend_id = await getFriendId(friend_name);
            addFriend(friend_id, friend_name, id);
        });
    }
}


async function addFriend(second_user_id, friend_name, id) {

    // Check if the friend is already added
    const checkRes = await fetch('/api/check_friend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, second_user_id })
    });

    const checkData = await checkRes.json();
    if (checkRes.status === 200 && checkData.exists) {
        console.log('Friend already added');
        return;
    }

    // Add the friend if not already added
    const res = await fetch('/api/add_friend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, second_user_id })
    });

    const data = await res.json();

    if (res.status === 200) {
        friends.push({ username: friend_name }); // Push friend object
        console.log('Friend added');
        generateFriends(friends);
        friend_list_dropdown.innerHTML = '';
    } else {
        console.error('Failed to add friend:', data.message);
    }
}


async function getFriendId(friend_name) {
    const res = await fetch(`/api/get_userIdByName?name=${friend_name}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({name: friend_name})
    });

    const data = await res.json();
    return data.id;
}

function highlightText(text, query) {
    const escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`^(${escapedQuery})`, 'i');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function generateFriends(friends) {
    if (friends.length === 0) {
        friend_list.innerHTML = '<p class="fri_not_found">No friends found</p>';
        return;
    }
    friend_list.innerHTML = friends.map(friend => 
        `<p class="fri_name">${friend.username}</p>`
    ).join('');

    const fri_elements = friend_list.getElementsByClassName('fri_name');
    for (const el of fri_elements) {
        el.addEventListener('click', () => {
            friend_list.querySelectorAll('.fri_name').forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
            room = `${username}-${el.textContent}`;
            receiver = el.textContent;
            socket.emit('join-room', `${room}`);
            chat_input_form.style.display = 'flex';
        });
    }
}

async function getFriendList(id) {
    const res = await fetch(`/api/get_friends?id=${id}`);
    const data = await res.json();

    if (res.status === 200) {
        return data;
    } else {
        throw new Error(data.message);
    }
}

// Debounce function
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
