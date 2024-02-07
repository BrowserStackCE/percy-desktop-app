

window.addEventListener('DOMContentLoaded',()=>{
    const progressBar = document.getElementById('downloadProgress');
    const progressLabel = document.getElementById('progressLabel');

    window.api.onProgressChange((progress)=>{
        console.log(progress);
        progressBar.value = progress;  // Update the progress bar value
        progressLabel.innerText = `Downloading Percy... ${Math.round(progress)}%`;  // Update the progress label
    })
})