import React, {useEffect, useState} from 'react'
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {useDebounce} from "react-use";
import {updateSearchCount} from "./appwrite.js";
import {getTrendingMovies} from "./appwrite.js";

const App = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [movies, setMovies] = useState([]);

    const [trendingError, setTrendingError] = useState(null);
    const [isTrendingLoading, setIsTrendingLoading] = useState(false);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    const API_BASE_URL = 'https://api.themoviedb.org/3';
    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

    const API_OPTIONS = {
        method: 'GET', headers: {
            accept: 'application/json', authorization: `Bearer ${API_KEY}`
        }
    }
    //Debounce the search term to avoid too many API calls
    // by waiting for 1000ms after the user stops typing
    useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm])

    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setError(null);
        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS);
            if (!response.ok) {
                throw new Error('Failed to fetch movies');
            }
            const data = await response.json();
            if (data === false) {
                setError(data.error || 'No movies found');
                setMovies([]);
                return;
            }
            setMovies(data.results || []);
            if (query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0])
            }
        } catch (e) {
            setError(e.response.data)
            console.log(`error fetching movies ${e} `)
        } finally {
            setIsLoading(false);
        }
    }
    const loadTrendingMovies = async () => {
        setIsTrendingLoading(true);
        setTrendingError(null);
        try {
            const movies = await getTrendingMovies();
            setTrendingMovies(movies);
        } catch (e) {
            console.log(`error fetching trending movies ${e} `)
            setTrendingError(e.response.data);
        } finally {
            setIsTrendingLoading(false);
        }
    }

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    return (<main>
        <div className="pattern"/>
        <div className="wrapper">
            <header>
                <img src="/hero.png" alt="herobanner"/>
                <h1 className="">Find
                    <span className="text-gradient"> Movies</span>
                    You'll enjoy Without the Hassle
                </h1>
                <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
            </header>
            {trendingMovies.length > 0 && (
                <section className="trending">
                    <h2>Trending Movies</h2>
                    {isTrendingLoading ? (<Spinner/>) : trendingError ? (
                            <p className="text-red-500">{trendingError} Error..</p>) :
                        (
                            <ul>
                                {trendingMovies.map((movie, index) => (
                                    <li key={movie.$id}>
                                        <p>{index + 1}</p>
                                        <img src={movie.poster_url} alt={movie.title}/>
                                    </li>
                                ))}
                            </ul>
                        )}

                </section>
            )}

            <section className="all-movies">
                <h2>All Movies</h2>
                {isLoading ? (<Spinner/>) : error ? (<p className="text-red-500">{error} Error..</p>) : (
                    <ul className="">
                        {movies.map((movie) => (<MovieCard key={movie.id} movie={movie}/>))}
                    </ul>)}
            </section>
        </div>
    </main>)
}
export default App
