import{r as s,A as a,j as i}from"./index-D43-IxU3.js";const l=()=>{const{showAds:n}=s.useContext(a),t=s.useRef(null);return s.useEffect(()=>{var c;if(t.current&&(t.current.innerHTML="",n)){const e=document.createElement("iframe");e.style.width="100%",e.style.height="320px",e.style.border="none",e.style.overflow="hidden",e.title="Advertisement",t.current.appendChild(e);const r=(c=e.contentWindow)==null?void 0:c.document;r&&(r.open(),r.write(`
                <!DOCTYPE html>
                <html>
                <head><style>body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;height:100%;}</style></head>
                <body>
                    <script type="text/javascript">
                        atOptions = {
                            'key' : '93250590c6cc4fa213dc408950ac67ef',
                            'format' : 'iframe',
                            'height' : 300,
                            'width' : 160,
                            'params' : {}
                        };
                    <\/script>
                    <script type="text/javascript" src="https://www.highperformanceformat.com/93250590c6cc4fa213dc408950ac67ef/invoke.js"><\/script>
                </body>
                </html>
            `),r.close())}},[n]),n?i.jsx("div",{className:"w-full flex justify-center my-8 min-h-[320px] items-center overflow-hidden",children:i.jsx("div",{ref:t,className:"w-full max-w-[320px]"})}):null};export{l as A};
