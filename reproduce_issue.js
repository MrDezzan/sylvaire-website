
async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/wiki');
        console.log('Status:', res.status);
        console.log('Text:', await res.text());
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
