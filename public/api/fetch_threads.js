async function fetch_threads() {
    const res = await fetch('/api/feeds');
    const data = await res.json();

    return data
}


export default fetch_threads;