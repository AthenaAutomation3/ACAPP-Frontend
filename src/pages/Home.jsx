/* eslint-disable no-unused-vars */
/* eslint-disable no-constant-condition */
import { useEffect, useState, useRef } from 'react';
import '../assets/pop.css';
import FullWidthTabs from '../components/Tabs';
import { AppContext } from '../AppContext';
import React from 'react';
import { Form, Navigate } from 'react-router-dom';
import { saveAs } from 'file-saver';

export default function Home() {
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const { Page, setPage, userCredentials, setUserCredentials } = React.useContext(AppContext);
  
  const [isPopupVisible, setPopupVisible] = useState(true);
  const [popupType, setPopupType] = useState(""); // "change_tool" or "add_reason"
  const socketRef = useRef(null);
  const [isZeroCalibrationTriggered, setIsZeroCalibrationTriggered] = useState(false);
  const [isHighCalibrationTriggered, setIsHighCalibrationTriggered] = useState(false);
  const [isLowCalibrationTriggered, setIsLowCalibrationTriggered] = useState(false);
  const [isMediumCalibrationTriggered, setIsMediumCalibrationTriggered] = useState(false);
  const [isSuccessCalibrationTriggered, setIsSuccessCalibrationTriggered] = useState(false);
  const [Success, setSuccess] = useState(false);
  const [mypopup, setmypopup] = useState(false);
  const [reason, setReason] = useState("");
  const [currentReading, setCurrentReading] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [prevToolStatus, setPrevToolStatus] = useState({
    Tool2: false,
    Tool3: false,
    Tool8: false,
    Restart: false,
    Check_Finish: false
  });
  const [approvetool, setapprovetoll] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [customOption, setCustomOption] = useState("");
  const [options] = useState(["Hard Material", "Excessive Allowance", "Previous Tool Broken", "Tool Worn-out", "custom"]);
  const [popMessage, setPopMessage] = useState({
    title: "Loading",
    message: "Please wait..."
  });
  const [Progress, setProgress] = useState(16);
  const [ID_Readings, setID_Readings] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [OD_Readings, setOD_Readings] = useState([]);
  // const [Success, setSuccess] = useState(false);
  const [ispopupvisiblemsg, setpopupvisiblemsg] = useState(false);
  const [isReasonvisible, setReasonvisible] = useState(false)
  const [NEW_ENTRY, setNEW_ENTRY] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [selectedTool, setSelectedTool] = useState();
  const [customReason, setCustomReason] = useState("");
  const [tools, setTools] = useState([]);
  const prevToolStatusRef = useRef({});
  const [isConfirmationPopupVisible, setIsConfirmationPopupVisible] = useState(false);
  const [pendingToolAction, setPendingToolAction] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingTool, setPendingTool] = useState(null);
  
  //start the calibration
  const Start = async () => {
    const res = await fetch('http://localhost:3006/Start');
    if (!res.ok) {
      alert("FAILED TO START")
    }
  }

  //fetches last 20 readings
  const fetchReadings = async () => {
    const result = await fetch('http://localhost:3006/Readings');
    if (!result.ok) {
      setPopMessage({
        title: "Error",
        message: "Cannot GET Readings"
      })
      setPopupVisible(true);
    } else {
      const data = await result.json();
      var id_readings = []
      var od_readings = []
      await data.forEach(async element => {
        id_readings.push(element.ID_Reading);
        od_readings.push(element.OD_Reading);
      })
      id_readings = id_readings.reverse();
      od_readings = od_readings.reverse();
      setID_Readings(id_readings);
      setOD_Readings(od_readings);
      // console.log(id_readings, od_readings);
    }
  }
   
  useEffect(()=>{
    setPage("Calibration");
  },[])

  useEffect(() => {
    async function setUp() {
      const data = await fetch('http://localhost:3006/Calibration');
      if (!data.ok) {
        alert("FAILED TO ENTER CALIBRATION MODE")
      }
      localStorage.setItem('SetUpMode', "False");
    }
    setUp();
  },[])

  //feteches the readings from the db
  useEffect(() => {
    if (!ID_Readings.length || !OD_Readings.length) {
      console.log("Data Fetched..")
      fetchReadings();
    }
  },[ID_Readings,OD_Readings])

  const updateReason = async () => {
    try {
      const response = await fetch("http://localhost:3006/updateReason", {
        method: "PUT", 
      });
      if (response.ok) {
        setPopupVisible(false); 
      } else {
        console.log("Failed to update reason");
      }
    } catch (error) {
      console.error("Error updating reason:", error);
    }
  };

  //web-socket to 
  useEffect(() => {
    if (!socketRef.current) {
      const connectWebSocket = () => {
        socketRef.current = new WebSocket("ws://localhost:3006/ws");
        
        socketRef.current.onopen = () => {
          console.log("WebSocket connected");
        };

        socketRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        socketRef.current.onclose = () => {
          console.log("WebSocket disconnected");
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        socketRef.current.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          setReason(data.Reason);

          // Handle calibration states
          if (data.ZERO === "False" && !isZeroCalibrationTriggered) {
            setPopMessage({
              title: "Zero Calibration",
              message: "Put Zero Calibration Master in Gauge",
            });
            setProgress(32);
            setPopupVisible(true);
            setShowProgress(true);
            setIsZeroCalibrationTriggered(true); 
            return;
          }

          if (data.HIGH === "False" && !isHighCalibrationTriggered) {
            setPopMessage({
              title: "High Calibration",
              message: "Put High Calibration Master in Gauge",
            });
            setProgress(48);
            setPopupVisible(true);
            setShowProgress(true);
            setIsHighCalibrationTriggered(true);
            return;
          }

          if (data.LOW === "False" && !isLowCalibrationTriggered)  {
            setPopMessage({
              title: "Low Calibration",
              message: "Put Low Calibration Master in Gauge",
            });
            setProgress(64);
            setPopupVisible(true);
            setShowProgress(true);
            setIsLowCalibrationTriggered(true);
            return;
          }

          if (data.MEDIUM === "False"  && !isMediumCalibrationTriggered) {
            setPopMessage({
              title: "Medium Calibration",
              message: "Put Medium Calibration Master in Gauge",
            });
            setProgress(80);
            setPopupVisible(true);
            setShowProgress(true);
            setIsMediumCalibrationTriggered(true);
            return;
          }

          if (data.START === "False" && !isSuccessCalibrationTriggered) {
            setPopMessage({
              title: "SUCCESS",
              message: "Calibration Successful",
            });
            setProgress(100);
            setShowProgress(true);
            setPopupVisible(true);
            setIsSuccessCalibrationTriggered(true);

            setTimeout(() => {
              setPopupVisible(false);
              setProgress(0);
              setShowProgress(false);
            }, 3000);

            await fetch("http://localhost:3006/Start");
            return;
          } else {
            setPopupVisible(false);
            setSuccess(true);
            if (data.TOOL_BROKEN === "True") {
              setSuccess(false);
              setPopMessage({
                title: "TOOL BROKEN",
                message: (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      fetch("http://localhost:3006/Tool");
                      setPopupVisible(false);
                      setSuccess(true);
                    }}
                  >
                    TOOL FIXED!
                  </button>
                ),
              });

              setShowProgress(false);
              setPopupVisible(true);
              setIsSuccessCalibrationTriggered(true);
              return;
            }
          }

          if(data.Reason==="True"){
            setPopMessage({
              title: "Add Reason",
              message: (
                <>
                  <button
                    className="btn btn-danger mr-[20px]"
                    onClick={()=>{updateReason();
                      setPopupVisible(false);  
                    }} 
                    style={{width:"100px",height:"60px" }}
                  >
                    OK
                  </button>
                </>
              ),
            });
            setProgress(0);
            setPopupVisible(true);
            setShowProgress(false);
            return;
          }

          // Handle tool states with state tracking
          if (data.Tool2 === "True" && !prevToolStatus.Tool2) {
            setmypopup(true);
            setShowProgress(false);
            setPopMessage({
              title: "Check Roughing Insert",
              message: (
                <>
                  <button
                    className="btn btn-danger mr-[20px]"
                    onClick={() => {
                      setPendingTool("tool2");
                      setShowConfirm(true);
                    }}
                    style={{ margin: "50px" }}
                  >
                    Changed
                  </button>
                  <button
                    className="btn btn-danger mr-[20px]"
                    onClick={() => {
                      fetch("http://localhost:3006/stillokTool2");
                      setmypopup(false);
                      setPrevToolStatus(prev => ({ ...prev, Tool2: false }));
                    }}
                  >
                    Still OK!!
                  </button>
                </>
              ),
            });
            setPrevToolStatus(prev => ({ ...prev, Tool2: true }));
          } else if (data.Tool3 === "True" && !prevToolStatus.Tool3) {
            setmypopup(true);
            setShowProgress(false);
            setPopMessage({
              title: "Check SemiFinish Insert ",
              message: (
                <>
                  <button
                    className="btn btn-danger mr-[20px]"
                    onClick={() => {
                      setPendingTool("tool3");
                      setShowConfirm(true);
                    }}
                    style={{ margin: "50px" }}
                  >
                    Changed
                  </button>
                  <button
                    className="btn btn-danger mr-[20px]"
                    onClick={() => {
                      console.log("Closing popup...");
                      setmypopup(false);
                      setPrevToolStatus(prev => ({ ...prev, Tool3: false }));
                      setTimeout(() => {
                        fetch("http://localhost:3006/stillokTool3")
                          .then(res => res.json())
                          .then(data => console.log("API Response:", data))
                          .catch(error => console.error("Fetch Error:", error));
                      }, 100);
                    }}
                  >
                    Still OK!!
                  </button>
                </>
              ),
            });
            setPrevToolStatus(prev => ({ ...prev, Tool3: true }));
          } else if (data.Tool8 === "True" && !prevToolStatus.Tool8) {
            setmypopup(true);
            setShowProgress(false);
            setPopMessage({
              title: "Check Finish Insert",
              message: (
                <>
                  <button
                    className="btn btn-danger mr-[20px]"
                    onClick={() => {
                      setPendingTool("tool8");
                      setShowConfirm(true);
                    }}
                    style={{ margin: "50px" }}
                  >
                    Changed
                  </button>
                  <button
                    className="btn btn-danger mr-[20px]"
                    onClick={() => {
                      fetch("http://localhost:3006/stillokTool8");
                      setmypopup(false);
                      setPrevToolStatus(prev => ({ ...prev, Tool8: false }));
                    }}
                  >
                    Still OK!!
                  </button>
                </>
              ),
            });
            setPrevToolStatus(prev => ({ ...prev, Tool8: true }));
          } else if (data.Restart === "True" && !prevToolStatus.Restart) {
            setmypopup(true);
            setShowProgress(false);
            setPopMessage({
              title: (
              <>
                Switch Off, Wait for Half a Minute
                <br />
                and Switch On
              </>
            ),
              message: (
                <>
                  <button
                    className="btn btn-danger mr-[20px]"
                    onClick={() => {
                      fetch("http://localhost:3006/stillokRestart");
                      setmypopup(false);
                      setPrevToolStatus(prev => ({ ...prev, Restart: false }));
                    }}
                  >
                   OK !!
                  </button>
                </>
              ),
            });
            setPrevToolStatus(prev => ({ ...prev, Restart: true }));
          }// else if (data.Check_Finish === "True" && !prevToolStatus.Check_Finish) {
//   setmypopup(true);
//   setShowProgress(false);
//   setPopMessage({
//     title: "Finished Insert Index ?",
//     message: (
//       <>
//         <button
//           className="btn btn-danger mr-[20px]"
//           onClick={() => {
//             fetch("http://localhost:3006/stillokCheck_Finish");
//             setmypopup(false);
//             setPrevToolStatus(prev => ({ ...prev, Check_Finish: false }));
//           }}
//           style={{ margin: "50px" }}
//         >
//           Yes👍🏻
//         </button>

//         <button
//           className="btn btn-danger mr-[20px]"
//           onClick={() => {
//             fetch("http://localhost:3006/stillokCheck_Finish");
//             setmypopup(false);
//             setPrevToolStatus(prev => ({ ...prev, Check_Finish: false }));
//           }}
//         >
//           No!!
//         </button>
//       </>
//     ),
//   });
//   setPrevToolStatus(prev => ({ ...prev, Check_Finish: true }));
// }


          ///////////////////////
// Confirmation Popup JSX
{showConfirm && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <h2 className="text-lg font-semibold mb-4">Are you sure?</h2>
      <div className="flex justify-center gap-4">
        <button
          className="btn btn-success"
          onClick={() => {
            handleToolChange(pendingTool);
            setShowConfirm(false);
            setmypopup(false);
            setPendingTool(null);
          }}
        >
          Yes
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setShowConfirm(false);
            setPendingTool(null);
          }}
        >
          No
        </button>
      </div>
    </div>
  </div>
)}
          /////////////////

          if (data.NEW_ENTRY === "True") {
            setNEW_ENTRY(true);
            fetchReadings();
          }

          // Update current reading
          if (data.ID_Reading) {
            setCurrentReading(data.ID_Reading);
          }
        };
      };

      connectWebSocket();
    }

    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [prevToolStatus]);

  useEffect(()=>{
    setIsZeroCalibrationTriggered(false);
    setIsLowCalibrationTriggered(false);
    setIsHighCalibrationTriggered(false);
    setIsMediumCalibrationTriggered(false);
    setIsSuccessCalibrationTriggered(false);
  },[])

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3006/ws");
  
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.ID_Reading) {
        setCurrentReading(data.ID_Reading);
      }
    };
  
    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };
  
    return () => {
      socket.close(); // Cleanup on unmount
    };
  },[]);

  const startMeasurement = async () => {
    console.log("in Measure")
    const res = await fetch('http://localhost:3006/NewEntry');
    if (!res.ok) {
      alert("FAILED TO START")
    }
    console.log(NEW_ENTRY);
    setNEW_ENTRY(false);
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handlechangedTool = () => {
    setPopupType("change_tool");
    setpopupvisiblemsg(true);
    setSelectedTool("");
    handlePopupVisibility("");
  };

  const handlePopupVisibility = (selectedValue) => {
    setPopupType("change_tool");
    setSelectedTool(selectedValue);

    setPopMessage({
      title: "Change Tool",
      message: (
        <form onSubmit={handleSubmit}> {/* Wrap inside a form */}
          <div>
            <select
              id="toolSelect"
              style={{ padding: "10px", background: "#212529", color: "white", width: "100%" }}
              value={selectedValue}
              onChange={(e) => handlePopupVisibility(e.target.value)}
            >
              <option value="">Select Tool</option>
              <option value="tool2">Tool 2</option>
              <option value="tool3">Tool 3</option>
              <option value="tool8">Tool 8</option>
            </select>
          </div>
        </form>
      ),
    });
  };

  useEffect(() => {
    // Logging the visibility of the popup
    console.log("Popup Visible State: ", isPopupVisible);
  }, [isPopupVisible]); // Track changes to the popupVisible state

  const handleAddReasons = () => {
    setPopupType("add_reason");
    setpopupvisiblemsg(true);
    setSelectedTool("");
    setCustomReason("");
    updatePopMessage("");
  };

  const updatePopMessage = (selectedValue) => {
    setPopupType("add_reason");
    setSelectedTool(selectedValue);

    if (selectedValue !== "Custom") {
      setCustomReason(""); // Reset input if NOT Custom
    }

    setPopMessage({
      title: "Add Reason",
      message: (
        <form onSubmit={handleSubmit}> {/* Wrap inside a form */}
          <div>
            <select
              id="toolSelect"
              style={{ padding: "10px", background: "#212529", color: "white", width: "100%" }}
              value={selectedValue}
              onChange={(e) => updatePopMessage(e.target.value)}
            >
              <option value="">Select Reason</option>
              <option value="Hard Material">Hard Material</option>
              <option value="Excessive Allowance">Excessive Allowance</option>
              <option value="Previous Tool Broken">Previous Tool Broken</option>
              <option value="Tool Worn-out">Tool Worn-out</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Custom Reason Input */}
          {selectedValue === "Custom" && (
            <input
              type="text"
              placeholder="Enter your custom reason..."
              onChange={(e) => setCustomReason(e.target.value)} 
              style={{
                marginTop: "10px",
                padding: "10px",
                background: "#212529",
                color: "white",
                width: "100%",
                border: "1px solid #6c757d",
                borderRadius: "5px",
              }}
            />
          )}
        </form>
      ),
    });
  };

  const handleSubmit = async () => {
    if (!selectedTool) {
      alert("Please select a reason.");
      return;
    }

    let reasonToSend = selectedTool === "Custom" ? customReason : selectedTool;

    if (popupType === "add_reason") {
      console.log("Myreading:",currentReading);
    
      try {
        const response = await fetch("http://localhost:3006/addReason", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: reasonToSend,            // The reason to send
            currentReading: currentReading   // The current reading ID from state
          }),
        });

        const data = await response.json();
        if (response.ok) {
          alert("Reason added successfully!");
          setpopupvisiblemsg(false);
        } else {
          alert("Failed to add reason: " + data.message);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error adding reason.");
      }
    }

    if(popupType==="change_tool") {
      if(reasonToSend==="tool2") {
        await fetch("http://localhost:3006/Tool2");
      }
      if(reasonToSend==="tool3") {
        await fetch("http://localhost:3006/Tool3");
      }
      if(reasonToSend==="tool8") {
        await fetch("http://localhost:3006/Tool8");
      }
      if (reasonToSend === "restart") {
         await fetch("http://localhost:3006/Restart");
      }
       if (reasonToSend === "check_finish") {
         await fetch("http://localhost:3006/Check_Finish");
      }
     
    }

    setSelectedTool("");
    setpopupvisiblemsg(false);
  };

  const handleClosePopup = () => {
    setpopupvisiblemsg(false);
    setSelectedTool("");  // Close the popup
  };

  const arrayToCSV = (array, headers) => {
    const csvRows = [headers.join(',')];
    array.forEach(row => {
      csvRows.push(row.join(','));
    });
    return csvRows.join('\n');
  };

  const downloadCSV = (data1, data2, filename = 'data.csv') => {
    const zip = (a, b) => a.map((k, i) => [k, b[i]]);
    const headers = ['ID_READINGS', 'OD_READINGS'];
    const csvData = arrayToCSV(zip(data1, data2), headers);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
  };

  const handleToolChange = async (toolType) => {
    setPendingToolAction(toolType);
    setIsConfirmationPopupVisible(true);
  };

  const confirmToolChange = async () => {
    try {
      if (pendingToolAction === "tool2") {
        await fetch("http://localhost:3006/updateTool2");
        await fetch("http://localhost:3006/Tool2");
      } else if (pendingToolAction === "tool3") {
        await fetch("http://localhost:3006/updateTool3");
        await fetch("http://localhost:3006/Tool3");
      } else if (pendingToolAction === "tool8") {
        await fetch("http://localhost:3006/updateTool8");
        await fetch("http://localhost:3006/Tool8");
      } else if (pendingToolAction === "restart") {
        await fetch("http://localhost:3006/updateRestart");
        await fetch("http://localhost:3006/Restart");
      } else if (pendingToolAction === "check_finish") {
        await fetch("http://localhost:3006/updateCheck_Finish");
        await fetch("http://localhost:3006/Check_Finish");
      }
      setmypopup(false);
      setIsConfirmationPopupVisible(false);
      setPendingToolAction(null);
    } catch (error) {
      console.error("Error updating tool:", error);
      alert("Failed to update tool. Please try again.");
    }
  };

  const cancelToolChange = () => {
    setIsConfirmationPopupVisible(false);
    setPendingToolAction(null);
  };

  if (!userCredentials) {
    return (
      <Navigate to="/login" />
    )
  }

  return (
    <div className="p-3 pb-0 position-relative" style={{ minWidth: "75%" ,Height:'100%'}}>
      <div className="container text-center dimmed-background ">
        {mypopup && (
          <>
            <div className="custom-popup bg-dark text-white" style={{ zIndex: 1000 }}>
              <h5 className='mb-3' style={{ fontSize: "2rem" }}>{popMessage.title}</h5>
              <p className='mb-3' style={{ fontSize: "0.5rem" }}>{popMessage.message}</p>
              {showProgress && <div className="progress" style={{ height: "1.5rem" }}>
                <div className="progress-bar progress-bar-striped bg-danger b-5" role="progressbar" style={{ width: `${Progress}%`, height: "100%" }} aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
              </div>}
            </div>
          </>
        )}

        {isPopupVisible && (
          <>
            <div className="custom-popup bg-dark text-white" style={{ zIndex: 1000 }}>
              <h5 className='mb-3' style={{ fontSize: "5rem" }}>{popMessage.title}</h5>
              <p className='mb-3' style={{ fontSize: "1.5rem" }}>{popMessage.message}</p>
              {showProgress && <div className="progress" style={{ height: "1.5rem" }}>
                <div className="progress-bar progress-bar-striped bg-danger b-5" role="progressbar" style={{ width: `${Progress}%`, height: "100%" }} aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
              </div>}
            </div>
            <div className="backdrop" style={{ zIndex: 999 }}></div>
          </>
        )}
      </div>

      <div className='d-flex justify-content-between'>
        <h2 className='mb-0'>Calibration</h2>
        <div className='d-flex align-items-center'>
          <button type="button" className="d-flex btn btn-danger text-center align-items-center mx-2" height="30%" onClick={startMeasurement} disabled={!NEW_ENTRY}>▸ Start</button>
          <button type="button" className="d-flex btn btn-danger text-center align-items-center mx-2" height="30%" onClick={() => { downloadCSV(ID_Readings, OD_Readings) }}>⤓Download</button>
        </div>
      </div>

      <hr className='m-2 mb-2 mx-0' style={{ borderColor: "#6c757d" }}></hr>

      {Success && <FullWidthTabs width="fluid" height="" id_readings={ID_Readings} od_readings={OD_Readings} handlechangedTool={handlechangedTool} handleAddReasons={handleAddReasons} />}

      {ispopupvisiblemsg && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#212529",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              width: "500px",
              height: "250px",
              textAlign: "center",
              zIndex: "1000",
            }}
          >
            <h2 style={{ color: 'white' }}>{popMessage.title}</h2>
            <div>{popMessage.message}</div>

            {/* Show buttons only if popupType is NOT 'add_reason' */}
            {popupType !== "reason_adding" && (
              <>
                <button
                  onClick={handleSubmit}
                  style={{
                    marginTop: "15px",
                    padding: "10px 20px",
                    backgroundColor: "#DC3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={handleClosePopup}
                  style={{
                    marginTop: "15px",
                    margin: "15px",
                    padding: "10px 20px",
                    backgroundColor: "#DC3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {isConfirmationPopupVisible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: "#212529",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              width: "60%",
              textAlign: "center",
              zIndex: 2001,
            }}
          >
            <h3 style={{ color: 'white', marginBottom: '20px', fontSize: "2rem" }}>Are you sure?</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
              <button
                onClick={confirmToolChange}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#DC3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  width: "150px",
                  height: "50px"
                }}
              >
                Yes
              </button>
              <button
                onClick={cancelToolChange}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  width: "150px",
                  height: "50px"
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}