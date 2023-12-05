import Admin from './Admin';
import App from './App'
import ReactDOM from 'react-dom/client'

if(document.getElementById('sharedoc-ai')){
    ReactDOM.createRoot(document.getElementById('sharedoc-ai')).render(<App />);
}
    

if(document.getElementById('sharedoc-ai-admin')){
    ReactDOM.createRoot(document.getElementById('sharedoc-ai-admin')).render(<Admin />);
}