 window.onload = function() {

    var scr = document.createElement("script");
     scr.type="text/javascript";
     scr.innerHTML = `const LoadScript = (url, cb) => { fetch(url).then(res => res.json()).then((out) => { cb(out) }).catch(err => { throw err }); }

   const links = {
    "link0":"https://raw.githubusercontent.com/rkurski/boliMnieNoga/grudzien2024/charactersManager.js",
    "link1":"https://raw.githubusercontent.com/rkurski/boliMnieNoga/grudzien2024/ballExp.js",
    "link2":"https://raw.githubusercontent.com/rkurski/boliMnieNoga/grudzien2024/ballUpgrade.js",
    "link3":"https://raw.githubusercontent.com/rkurski/boliMnieNoga/grudzien2024/ballReset.js",
    "link4":"https://raw.githubusercontent.com/rkurski/boliMnieNoga/grudzien2024/ballManager.js",
    "link5":"https://raw.githubusercontent.com/rkurski/boliMnieNoga/grudzien2024/script1-2.js",
    "link6":"https://raw.githubusercontent.com/rkurski/boliMnieNoga/grudzien2024/ekwipunek.js"
 };
 
 const fetchPromises = Object.values(links).map(link => {
   return fetch(link).then(response => response.text());
 });
 
 Promise.all(fetchPromises)
   .then(scripts => {
     scripts.forEach(script => {
       $("body").append("<script>"+script+"</script>");
     });
   })
   .catch(err => { 
     console.log("Error fetching data:", err); 
   });
 
 
 
 `    
   document.body.appendChild(scr) 
 }