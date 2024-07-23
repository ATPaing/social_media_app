async function getRepliesByThreadId(threadId) {
    const res = await fetch(`/api/threads/${threadId}`);
    const data = await res.json();

    return data;
}

export default getRepliesByThreadId;