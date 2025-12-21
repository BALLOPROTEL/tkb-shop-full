import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Force le navigateur à ne pas retenir la position du scroll au rechargement
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        // Remonte tout en haut instantanément
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}