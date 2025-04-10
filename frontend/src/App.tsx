import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import Dashboard from './components/Dashboard'
import './styles/App.css'

function App() {

  return (
    <div className="app-container bg-dark text-light">
      <div className="d-flex" >
          <Dashboard />
      </div>
    </div>
  )
}

export default App
