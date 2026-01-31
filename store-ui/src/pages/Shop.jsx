import React, { useState, useEffect } from 'react';
// ... other imports

const Shop = () => {
  // ... state declarations

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    // Ensure your fetchProducts function accepts the signal
    fetchProducts({ signal: controller.signal })
      .then(data => setProducts(data))
      .catch(err => {
        // Ignore errors caused by manual cancellation
        if (err.name !== 'AbortError') {
          setNotice({ type: "error", message: err.message });
        }
      })
      .finally(() => {
        // Only update state if the component hasn't unmounted
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort(); // Cleanup function
  }, []);

  // ... rest of component
};