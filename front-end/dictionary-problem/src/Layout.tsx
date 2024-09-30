import React from 'react'; 

const Layout: React.FC = ({children}) => {
    return (
        <div>
            <header>
                <h1>My Application</h1>
            </header>
            <main>
                {children}
            </main>
            <footer>
                <p>&copy; 2023 My Application</p>
            </footer>
        </div>
    );
};

export default Layout;