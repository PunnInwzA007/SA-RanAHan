// auth.js
(function(){
  const user = JSON.parse(sessionStorage.getItem("ranUser") || "null");
  if(!user){
    // ถ้าไม่ได้ login เด้งกลับ index.html
    window.location.href="index.html";
    return;
  }

  // ตรวจ role ของหน้า
  const page = window.location.pathname.split("/").pop();

  if(page.startsWith("manager") && user.role!=="manager"){
    window.location.href="index.html";
  }
  if(page.startsWith("staff") && user.role!=="staff"){
    window.location.href="index.html";
  }
  if(page.startsWith("moniter") && user.role!=="monitor"){
    window.location.href="index.html";
  }
  if(page.startsWith("customer") && user.role!=="customer"){
    window.location.href="index.html";
  }

  // เพิ่มปุ่ม logout
  const nav = document.querySelector(".navbar .ms-auto");
  if(nav && !document.getElementById("btnLogout")){
    const btn = document.createElement("button");
    btn.id = "btnLogout";
    btn.className="btn btn-sm btn-light";
    btn.innerText="Logout";
    btn.onclick=()=>{
      sessionStorage.removeItem("ranUser");
      window.location.href="index.html";
    };
    nav.appendChild(btn);
  }
})();
