const { parentPort } = require('worker_threads');
const bcrypt = require('bcrypt')

console.log('worker thread started')

const hashPassword = async (password, ITER_COUNT) => {
    const hashedPassword = await bcrypt.hash(password, ITER_COUNT);
    parentPort.postMessage({hashedPassword});
}

const comparePassword = async (password, hashedPassword) => {
  const passwordMatch = await bcrypt.compare(password, hashedPassword);
  parentPort.postMessage({passwordMatch});
}


// Listener
parentPort.on('message', async (data) => {
  const { work } = data.workerData;

  if(work === 'hash password') {
    const { password, ITER_COUNT } = data.workerData;
    await hashPassword(password, ITER_COUNT);
  } else if(work === 'compare password') {
    const { password, hashedPassword } = data.workerData;
    await comparePassword(password, hashedPassword);
  }
})

