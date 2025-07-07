import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { motion } from 'framer-motion';

function AnalyticsChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Views',
            data: data.views,
            borderColor: '#00f2fe',
            fill: false,
          },
          {
            label: 'Likes',
            data: data.likes,
            borderColor: '#ff007a',
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#ffffff' } } },
        scales: {
          x: { ticks: { color: '#ffffff' } },
          y: { ticks: { color: '#ffffff' } },
        },
      },
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 bg-opacity-50 p-4 rounded-lg glassmorphism"
    >
      <canvas ref={chartRef}></canvas>
    </motion.div>
  );
}

export default AnalyticsChart;