

window.addEventListener('DOMContentLoaded',()=>{
    const progressBar = document.getElementById('progressValue');
    const progressLabel = document.getElementById('progressLabel');

    window.api.onProgressChange((progress)=>{
        progressBar.style.width = `${progress}%`;  // Update the progress bar value
        progressLabel.innerText = `Downloading Percy... ${Math.round(progress)}%`;  // Update the progress label
    })

    window.api.onUnzip(()=>{
        progressLabel.innerText = "Unziping..."
    })
})