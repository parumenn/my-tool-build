import{r as c,A as a,j as i}from"./index-CUHQoIdE.js";const d=()=>{const{showAds:s}=c.useContext(a),t=c.useRef(null);return c.useEffect(()=>{var r;if(t.current&&(t.current.innerHTML="",s)){const e=document.createElement("iframe");e.style.width="100%",e.style.height="300px",e.style.border="none",e.style.overflow="hidden",e.title="Advertisement",t.current.appendChild(e);const n=(r=e.contentWindow)==null?void 0:r.document;n&&(n.open(),n.write(`
                <!DOCTYPE html>
                <html>
                <head><style>body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;height:100%;}</style></head>
                <body>
                    <script async="async" data-cfasync="false" src="https://pl28654616.effectivegatecpm.com/7fc3cc745c4b31d1928e463b50abab50/invoke.js"><\/script>
                    <div id="container-7fc3cc745c4b31d1928e463b50abab50"></div>
                </body>
                </html>
            `),n.close())}},[s]),s?i.jsx("div",{className:"w-full flex justify-center my-8 min-h-[300px] items-center overflow-hidden",children:i.jsx("div",{ref:t,className:"w-full max-w-[350px]"})}):null};export{d as A};
