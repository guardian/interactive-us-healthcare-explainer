var el = document.createElement('script');
el.src = '<%= path %>/app.js';
document.body.appendChild(el);

const table = document.querySelector(".element-embed iframe");
const tableHtml = table.getAttribute("srcdoc");
table.parentNode.innerHTML = tableHtml;