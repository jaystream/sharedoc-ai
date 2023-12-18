import axios from "axios";
const reactAppData = window.xwbVar || {}
axios.defaults.withCredentials = true;

const axiosClient = axios.create({
    //baseURL: `${reactAppData.ajaxURL}`,
    headers: {
        //'Content-Type': 'multipart/form-data',
        'Content-Type': 'application/x-www-form-urlencoded',
        //'Content-Type': false,
        'X-WP-Nonce': reactAppData.nonce,
    }
})


axiosClient.interceptors.request.use((config)=> {
    //const token = localStorage.getItem('TOKEN');
    //config.headers.Authorization = `Bearer ${token}`
    return config;
})

axiosClient.interceptors.response.use(response => {
    return response;
}, error => {
    throw error;
});
export default axiosClient;