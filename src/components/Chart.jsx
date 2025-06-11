import { useEffect, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { axisClasses } from "@mui/x-charts/ChartsAxis";
import PropTypes from "prop-types";

export default function BasicArea({ Readings, featureType }) {
  const [usl, setUsl] = useState(null);
  const [lsl, setLsl] = useState(null);
  const [uslControlled, setUslControlled] = useState(null);
  const [lslControlled, setLslControlled] = useState(null);
  const [mean, setMean] = useState(null);

  useEffect(() => {
    async function fetchLimits() {
      try {
        //const response = await fetch("http://localhost:3006/usllsl");
        const response = await fetch("http://localhost:3006/newusllsl");
        if (!response.ok) {
          console.error("Failed to fetch data");
          return;
        }

        const data = await response.json();
        console.log("API Response:", data);

        if (data?.result?.length > 0) {
          // Find the limits based on ID (1 for OD, 2 for ID)
          const limitData = data.result.find((item) => 
            featureType === "OD" ? item.ID === 1 : item.ID === 2
          );

          if (limitData) {
            setUsl(Number(limitData.USL));
            setLsl(Number(limitData.LSL));
            setUslControlled(Number(limitData.USL_controlled));
            setLslControlled(Number(limitData.LSL_controlled));
            setMean(Number(limitData.Mean));
          } else {
            console.error("Limits not found for feature type:", featureType);
          }
        } else {
          console.error("Invalid API response format:", data);
        }
      } catch (error) {
        console.error("Error fetching limits:", error);
      }
    }

    fetchLimits();
  }, [featureType]);

  if (!Array.isArray(Readings) || Readings.length === 0) {
    return <p style={{ color: "white" }}>No data available</p>;
  }

  return (
    <div style={{ width: "100%", height: "54vh", maxWidth: "100%" }}>
      <LineChart
        className="text-center"
        series={[
          {
            data: Readings,
            curve: "linear",
            color: "#FF0000",
            label: "Readings",
          },
          usl !== null && {
            data: Array(Readings.length).fill(usl),
            curve: "linear",
            color: "#FFA500",
            dashArray: "5 5",
            showMark: false,
            label: "USL",
          },
          lsl !== null && {
            data: Array(Readings.length).fill(lsl),
            curve: "linear",
            color: "#00FF00",
            dashArray: "5 5",
            showMark: false,
            label: "LSL",
          },
          uslControlled !== null && {
            data: Array(Readings.length).fill(uslControlled),
            curve: "linear",
            color: "#FFFF00",
            dashArray: "5 5",
            showMark: false,
            label: "USL Controlled",
          },
          lslControlled !== null && {
            data: Array(Readings.length).fill(lslControlled),
            curve: "linear",
            color: "#00FFFF",
            dashArray: "5 5",
            showMark: false,
            label: "LSL Controlled",
          },
          mean !== null && {
            data: Array(Readings.length).fill(mean),
            curve: "linear",
            color: "#FFFFFF",
            dashArray: "5 5",
            showMark: false,
            label: "Mean",
          },
        ].filter(Boolean)}
        xAxis={[
          {
            data: Array.from({ length: Readings.length }, (_, i) => i),
            //label: "Sample Number",
          },
        ]}
        yAxis={[
          {
            //label: `${featureType} Reading`,
          },
        ]}
        grid={{ stroke: "white" }}
        sx={() => ({
          [`.${axisClasses.root}`]: {
            [`.${axisClasses.tick}, .${axisClasses.line}`]: {
              stroke: "#FFFFFF",
              strokeWidth: 1,
            },
            [`.${axisClasses.tickLabel}`]: {
              fill: "#FFFFFF",
              fontSize: "10px",
            },
            [`.${axisClasses.label}`]: {
              fill: "#FFFFFF",
              fontSize: "12px",
            },
          },
          backgroundColor: "#212529",
          ["& .MuiMarkElement-root"]: {
            fill: "#212529",
          },
        })}
        legend={{
          position: {
            vertical: 'top',
            horizontal: 'right',
          },
          itemTextStyle: {
            fill: '#FFFFFF',
            fontSize: '10px',
          },
          padding: 10,
          itemMarkWidth: 10,
          itemMarkHeight: 10,
        }}
      />
    </div>
  );
}

BasicArea.propTypes = {
  Readings: PropTypes.arrayOf(PropTypes.number).isRequired,
  featureType: PropTypes.string.isRequired,
};