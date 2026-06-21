// // Simple implementation that strictly follows React Hook rules
// import React, { useState, createContext, useContext, useEffect } from 'react';
// import {
//     DndContext,
//     DragOverlay,
//     useDraggable,
//     useDroppable,
//     closestCenter,
//     PointerSensor,
//     useSensors,
//     useSensor
// } from '@dnd-kit/core';

// // Create context
// const EmployeeDndContext = createContext();

// // Provider component with minimized complexity
// const DndProvider = ({ children }) => {
//     const [activeId, setActiveId] = useState(null);
//     const [activeEmployee, setActiveEmployee] = useState(null);
//     const [allocatedEmployees, setAllocatedEmployees] = useState({});

//     const sensors = useSensors(
//         useSensor(PointerSensor, {
//             activationConstraint: { distance: 5 }
//         })
//     );

//     function handleDragStart(event) {
//         setActiveId(event.active.id);
//         setActiveEmployee(event.active.data.current?.employee);
//     }

//     function handleDragEnd(event) {
//         const { active, over } = event;
//         if (over) {
//             const employee = active.data.current?.employee;
//             if (employee) {
//                 // const [, rowIdentifier] = over.id.split('-');
//                 const rowId = over.id.replace('allocation-', '');

//                 setAllocatedEmployees(prev => {
//                     // const rowKey = rowIdentifier;
//                     return {
//                         ...prev,
//                         [rowId]: [employee] // Just one employee per row
//                     };
//                 });
//             }
//         }
//         setActiveId(null);
//         setActiveEmployee(null);
//     }

//     function removeEmployee(rowIdentifier, employeeId) {
//         setAllocatedEmployees(prev => {
//             const rowKey = rowIdentifier;
//             return {
//                 ...prev,
//                 [rowKey]: (prev[rowKey] || []).filter(e => e.id !== employeeId)
//             };
//         });
//     }

//     function addEmployee(rowIdentifier, employee) {
//         setAllocatedEmployees(prev => {
//             const rowKey = rowIdentifier;
//             return {
//                 ...prev,
//                 [rowKey]: [employee] // Just one employee per row
//             };
//         });
//     }

//     function getAllocatedEmployeeIds() {
//         const ids = new Set();
//         Object.values(allocatedEmployees).forEach(employees => {
//             employees.forEach(employee => ids.add(employee.id));
//         });
//         return ids;
//     }

//     const value = {
//         activeId,
//         activeEmployee,
//         allocatedEmployees,
//         addEmployee,
//         removeEmployee,
//         getAllocatedEmployeeIds
//     };

//     return (
//         <EmployeeDndContext.Provider value={value}>
//             <DndContext
//                 sensors={sensors}
//                 collisionDetection={closestCenter}
//                 onDragStart={handleDragStart}
//                 onDragEnd={handleDragEnd}
//             >
//                 {children}
//                 <DragOverlay>
//                     {activeEmployee && (
//                         <div className="inline-flex items-center px-3 py-1 border border-green-500 rounded-lg text-sm font-medium bg-white shadow-lg">
//                             <span className="whitespace-normal break-words">
//                                 {activeEmployee.name} - {activeEmployee.id} ({activeEmployee.line})
//                             </span>
//                         </div>
//                     )}
//                 </DragOverlay>
//             </DndContext>
//         </EmployeeDndContext.Provider>
//     );
// };

// // Custom hook to access context
// const useDnd = () => useContext(EmployeeDndContext);

// // Helper function for parsing preferred employees
// function parsePreferredEmployees(preferredEmployeesStr) {
//     if (!preferredEmployeesStr || typeof preferredEmployeesStr !== 'string') return [];

//     try {
//         const employees = [];
//         const uniqueIds = new Set();

//         // Split by pipe for different locations
//         const sections = preferredEmployeesStr.split('|');

//         sections.forEach(section => {
//             // Use regex to extract employee information
//             const regex = /([\w\s]+)-\s*(\d+)\s*\[Line:\s*([^,]+)/g;

//             let match;
//             while ((match = regex.exec(section)) !== null) {
//                 const name = match[1].trim();
//                 const id = match[2].trim();
//                 const linePart = match[3].trim();
//                 // Extract just the line number/name without capacity
//                 const line = linePart.split(',')[0].trim();

//                 if (!uniqueIds.has(id)) {
//                     uniqueIds.add(id);
//                     employees.push({
//                         name: name,
//                         id: id,
//                         line: line
//                     });
//                 }
//             }
//         });

//         return employees;
//     } catch (error) {
//         console.error('Error parsing preferred employees:', error);
//         return [];
//     }
// }

// function EmployeeDraggable({ employee, rowIdentifier }) {
//     const { getAllocatedEmployeeIds } = useDnd();

//     // Check if this employee is already allocated anywhere
//     const allocatedIds = getAllocatedEmployeeIds();
//     const isAllocated = allocatedIds.has(employee.id);

//     // If already allocated, don't render it
//     if (isAllocated) {
//         return null;
//     }

//     const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
//         //   id: `employee-${rowIdentifier}-${employee.id}`,
//         id: `employee-${employee.id}-${rowIdentifier}`,
//         data: { employee: { ...employee, rowIdentifier } }
//     });

//     // Create detailed tooltip content
//     const tooltipContent = `ID: ${employee.id}\nName: ${employee.name}\nLine: ${employee.line}`;

//     return (
//         <div
//             ref={setNodeRef}
//             {...attributes}
//             {...listeners}
//             style={{
//                 width: '100%',
//                 display: 'inline-flex',
//                 alignItems: 'center',
//                 padding: '1px 4px',
//                 border: '1px solid #ccc', // Gray border for each name
//                 borderRadius: '3px',
//                 fontSize: '0.8rem',
//                 lineHeight: '1.2',
//                 cursor: 'grab',
//                 overflow: 'hidden',
//                 textOverflow: 'ellipsis',
//                 whiteSpace: 'nowrap',
//                 height: '22px',
//                 backgroundColor: 'white',
//                 opacity: isDragging ? 0.5 : 1,
//                 color: '#000000', // Text color
//             }}
//             title={tooltipContent}
//         >
//             <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                 {employee.id} - {employee.name} ({employee.line})
//             </span>
//         </div>
//     );
// }

// // Simplified preferred employees renderer
// function PreferredEmployeesRenderer(props) {
//     const { allocatedEmployees } = useDnd();
//     const [employees, setEmployees] = useState([]);
//     const [allocatedIds, setAllocatedIds] = useState(new Set());

//     // Use row index as the unique identifier
//     const rowId = props.node.id;

//     // Parse employees from preferred employees string
//     useEffect(() => {
//         const parsedEmployees = parsePreferredEmployees(props.value);
//         setEmployees(parsedEmployees);
//     }, [props.value]);

//     // Get allocated employee IDs
//     useEffect(() => {
//         const ids = getAllocatedEmployeeIds();
//         setAllocatedIds(ids);
//     }, [allocatedEmployees]);

//     // Function to get all allocated employee IDs
//     const getAllocatedEmployeeIds = () => {
//         const ids = new Set();
//         Object.values(allocatedEmployees).forEach(employees => {
//             employees.forEach(employee => ids.add(employee.id));
//         });
//         return ids;
//     };

//     // Get up to 4 non-allocated employees
//     let availableEmployees = employees.filter(employee => !allocatedIds.has(employee.id));

//     // If we need to show more employees to meet the required count
//     // we'll add placeholder slots for consistent layout
//     const numPlaceholders = Math.max(0, Math.min(4 - availableEmployees.length, 4));
//     const placeholders = Array(numPlaceholders).fill({ isPlaceholder: true });

//     // Create pairs of employees for the grid layout
//     const createEmployeePairs = (employeeList) => {
//         const pairs = [];
//         for (let i = 0; i < employeeList.length; i += 2) {
//             pairs.push(employeeList.slice(i, i + 2));
//         }
//         return pairs;
//     };

//     // Limit to only show first 4 available employees + any needed placeholders
//     const displayItems = [...availableEmployees.slice(0, 4), ...placeholders].slice(0, 4);
//     const employeePairs = createEmployeePairs(displayItems);

//     return (
//         <div style={{
//             display: 'flex',
//             flexDirection: 'column',
//             gap: '2px',
//             width: '90%',
//             margin: '16px',
//             padding: '0', // No padding
//             border: 'none', // No border
//             marginTop: '-5px', // Move it more upward
//             backgroundColor: 'transparent', // No background color

//         }}>
//             {employeePairs.map((pair, pairIndex) => (
//                 <div
//                     key={`pair-${rowId}-${pairIndex}`}
//                     style={{
//                         display: 'flex',
//                         flexDirection: 'row',
//                         gap: '4px',
//                         width: '100%',
//                         // marginBottom: '2px',
//                         height: '22px'
//                     }}
//                 >
//                     {pair.map((item, idx) => (
//                         <div
//                             key={item.isPlaceholder ? `placeholder-${rowId}-${pairIndex}-${idx}` : `employee-${item.id}-${rowId}`}
//                             style={{
//                                 flex: 1,
//                                 minWidth: '180px',
//                                 maxWidth: 'calc(40% - 2px)'
//                             }}
//                         >
//                             {!item.isPlaceholder && (
//                                 <EmployeeDraggable
//                                     employee={item}
//                                     rowIdentifier={rowId}
//                                 />
//                             )}
//                         </div>
//                     ))}
//                     {pair.length === 1 && <div style={{ flex: 1, minWidth: '180px' }}></div>}
//                 </div>
//             ))}
//         </div>
//     );
// }

// // Simplified final allocation renderer

// function FinalAllocationRenderer(props) {
//     const { allocatedEmployees, removeEmployee, addEmployee } = useDnd();
//     const [initialized, setInitialized] = useState(false);

//     // Use row index as the unique identifier
//     const rowId = props.node.id;

//     // Get employees from the DnD context
//     const dndEmployees = allocatedEmployees[rowId] || [];

//     // Initialize from data on first render if needed
//     useEffect(() => {
//         // Skip if already initialized or we have employees or no data
//         if (initialized || dndEmployees.length > 0 || !props.data) {
//             setInitialized(true);
//             return;
//         }

//         // Get employee data
//         const name = props.data.Final_Allocation;
//         const id = props.data.Allocated_Employee_ID;
//         const line = props.data.Allocated_Line;

//         // Only add if we have name and id
//         if (name && id && name !== '-' && name !== null) {
//             const employee = {
//                 name: name,
//                 id: id.toString(),
//                 line: line || ''
//             };

//             addEmployee(rowId, employee);
//         }

//         // Mark as initialized
//         setInitialized(true);
//     }, [initialized, props.data, dndEmployees.length, rowId, addEmployee]);

//     // Setup drop zone
//     const { setNodeRef, isOver } = useDroppable({
//         id: `allocation-${rowId}`
//     });

//     // Create a full tooltip content with all employee details
//     const createTooltipContent = (employees) => {
//         if (employees.length === 0) return "";

//         return employees.map(employee =>
//             `ID: ${employee.id}, Name: ${employee.name}, Line: ${employee.line}`
//         ).join('\n');
//     };

//     const tooltipContent = createTooltipContent(dndEmployees);

//     return (
//         <div
//             ref={setNodeRef}
//             className={`
//                 min-h-[40px]
//                 w-full
//                 border-2
//                 ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
//                 rounded
//                 p-1
//                 flex flex-wrap gap-1
//             `}
//             title={tooltipContent}
//             style={{
//                 maxHeight: '80px',
//                 overflow: 'auto',
//                 width: '25vh',
//             }}
//         >
//             {dndEmployees.map(employee => (
//                 <div
//                     key={employee.id}
//                     className="inline-flex items-center px-3 py-1 rounded-lg text-sm text-black font-satoshi"
//                     style={{
//                         maxWidth: '100%',
//                         marginBottom: '2px'
//                     }}
//                 >
//                     <span
//                         className="whitespace-normal break-words"
//                         style={{
//                             display: '-webkit-box',
//                             WebkitLineClamp: 2,
//                             WebkitBoxOrient: 'vertical',
//                             overflow: 'hidden',
//                             textOverflow: 'ellipsis',
//                             maxHeight: '2.4em', // Limit to 2 lines of text
//                             lineHeight: '1.2'
//                         }}
//                         title={`${employee.id} - ${employee.name} (${employee.line})`}
//                     >
//                         {employee.id} - {employee.name} ({employee.line})
//                     </span>
//                     <button
//                         onClick={() => removeEmployee(rowId, employee.id)}
//                         className="ml-2 text-red-500 font-bold flex-shrink-0"
//                     >
//                         ×
//                     </button>
//                 </div>
//             ))}
//         </div>
//     );
// }

// export {
//     DndProvider,
//     PreferredEmployeesRenderer,
//     FinalAllocationRenderer,
//     useDnd, 
//     useDraggable
// };

import React, { useState, createContext, useContext, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    closestCenter,
    PointerSensor,
    useSensors,
    useSensor
} from '@dnd-kit/core';
import API from '../API/api';

// Create context
const EmployeeDndContext = createContext();

// Provider component with minimized complexity
const DndProvider = ({ children, onAllocationChange, onRemoveEmployee }) => {
    const [activeId, setActiveId] = useState(null);
    const [activeEmployee, setActiveEmployee] = useState(null);
    const [allocatedEmployees, setAllocatedEmployees] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }
        })
    );

    function handleDragStart(event) {
        setActiveId(event.active.id);
        setActiveEmployee(event.active.data.current?.employee);
    }

    async function handleDragEnd(event) {
        const { active, over } = event;
        if (over) {
            const employee = active.data.current?.employee;
            if (employee) {
                const rowId = over.id.replace('allocation-', '');

                try {
                    setIsUpdating(true);

                    // Get the Dday_ID from the employee's rowIdentifier or use rowId as fallback
                    const ddayId = employee.rowIdentifier.split('-')[0] || rowId;

                    // Format the allocation data as required by the API
                    const finalAllocation = `${employee.id} - ${employee.name} (${employee.line})`;

                    // Update local state first for immediate UI feedback
                    setAllocatedEmployees(prev => ({
                        ...prev,
                        [rowId]: [employee] // Just one employee per row
                    }));

                    // Call the API with the exact payload format required
                    await API.updateAllocatedEmployees(ddayId, finalAllocation);

                    // Trigger refresh of data after successful API update
                    if (onAllocationChange && typeof onAllocationChange === 'function') {
                        onAllocationChange();
                    }
                } catch (error) {
                    console.error("Error updating allocated employee:", error);

                    // Revert the state change if the API call fails
                    setAllocatedEmployees(prev => {
                        const newState = { ...prev };
                        delete newState[rowId];
                        return newState;
                    });
                } finally {
                    setIsUpdating(false);
                }
            }
        }
        setActiveId(null);
        setActiveEmployee(null);
    }

    async function removeEmployee(rowIdentifier) {
        try {
            setIsUpdating(true);

            // Get the Dday_ID from the rowIdentifier
            const ddayId = rowIdentifier.split('-')[0];
            const rowId = rowIdentifier.split('-').slice(1).join('-');

            // Update local state for immediate UI feedback
            setAllocatedEmployees(prev => {
                const newState = { ...prev };
                delete newState[rowId]; // Remove the entire entry, not just set to empty array
                return newState;
            });

            // When removing an employee, send empty string for finalAllocation
            const finalAllocation = "";

            // Call the API with the exact payload format
            await API.updateAllocatedEmployees(ddayId, finalAllocation);

            if (onRemoveEmployee && typeof onRemoveEmployee === 'function') {
                onRemoveEmployee(ddayId);
            } else if (onAllocationChange && typeof onAllocationChange === 'function') {
                // Fallback to the regular allocation change handler if remove handler not provided
                onAllocationChange(ddayId);
            }
        } catch (error) {
            console.error("Error removing allocated employee:", error);
        } finally {
            setIsUpdating(false);
        }
    }

    function clearAllocationForDdayId(ddayId) {
        setAllocatedEmployees(prev => {
            const newState = { ...prev };
            // Find and remove all rows that belong to this Dday_ID
            Object.keys(newState).forEach(rowId => {
                const employees = newState[rowId];
                if (employees && employees.length > 0) {
                    const employee = employees[0];
                    if (employee.rowIdentifier && employee.rowIdentifier.startsWith(ddayId + '-')) {
                        delete newState[rowId];
                    }
                }
            });
            return newState;
        });
    }

    function getAllocatedEmployeeIds() {
        const ids = new Set();
        Object.values(allocatedEmployees).forEach(employees => {
            employees.forEach(employee => ids.add(employee.id));
        });
        return ids;
    }

    const value = {
        activeId,
        activeEmployee,
        allocatedEmployees,
        removeEmployee,
        getAllocatedEmployeeIds,
        isUpdating,
        clearAllocationForDdayId
    };

    return (
        <EmployeeDndContext.Provider value={value}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {children}
                <DragOverlay>
                    {activeEmployee && (
                        <div className="inline-flex items-center px-3 py-1 border border-green-500 rounded-lg text-sm font-medium bg-white shadow-lg">
                            <span className="whitespace-normal break-words">
                                {activeEmployee.id} - {activeEmployee.name} ({activeEmployee.line})
                            </span>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </EmployeeDndContext.Provider>
    );
};

// Custom hook to access context
const useDnd = () => useContext(EmployeeDndContext);

// Helper function for parsing preferred employees
function parsePreferredEmployees(preferredEmployeesStr) {
    if (!preferredEmployeesStr || typeof preferredEmployeesStr !== 'string') return [];

    try {
        const employees = [];
        const uniqueIds = new Set();

        // Split by pipe for different locations
        const sections = preferredEmployeesStr.split('|');

        sections.forEach(section => {
            // Use regex to extract employee information
            const regex = /([\w\s]+)-\s*(\d+)\s*\[Line:\s*([^,]+)/g;

            let match;
            while ((match = regex.exec(section)) !== null) {
                const name = match[1].trim();
                const id = match[2].trim();
                const linePart = match[3].trim();
                // Extract just the line number/name without capacity
                const line = linePart.split(',')[0].trim();

                if (!uniqueIds.has(id)) {
                    uniqueIds.add(id);
                    employees.push({
                        name: name,
                        id: id,
                        line: line
                    });
                }
            }
        });

        return employees;
    } catch (error) {
        console.error('Error parsing preferred employees:', error);
        return [];
    }
}

function EmployeeDraggable({ employee, rowIdentifier }) {
    const { getAllocatedEmployeeIds } = useDnd();

    // Check if this employee is already allocated anywhere
    const allocatedIds = getAllocatedEmployeeIds();
    const isAllocated = allocatedIds.has(employee.id);

    // If already allocated, don't render it
    if (isAllocated) {
        return null;
    }

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `employee-${employee.id}-${rowIdentifier}`,
        data: { employee: { ...employee, rowIdentifier } }
    });

    // Create detailed tooltip content
    const tooltipContent = `ID: ${employee.id}\nName: ${employee.name}\nLine: ${employee.line}`;

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '1px 4px',
                border: '1px solid #ccc', // Gray border for each name
                borderRadius: '3px',
                fontSize: '0.8rem',
                lineHeight: '1.2',
                cursor: 'grab',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                height: '22px',
                backgroundColor: 'white',
                opacity: isDragging ? 0.5 : 1,
                color: '#000000', // Text color
            }}
            title={tooltipContent}
        >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {employee.id} - {employee.name} ({employee.line})
            </span>
        </div>
    );
}

// Simplified preferred employees renderer
function PreferredEmployeesRenderer(props) {
    const { allocatedEmployees } = useDnd();
    const [employees, setEmployees] = useState([]);
    const [allocatedIds, setAllocatedIds] = useState(new Set());

    // Use row index as the unique identifier
    const rowId = props.node.id;

    // Get the Dday_ID from the row data
    const ddayId = props.data?.Dday_ID || '';

    // Construct a complete row identifier with Dday_ID
    const completeRowId = `${ddayId}-${rowId}`;

    // Parse employees from preferred employees string
    useEffect(() => {
        const parsedEmployees = parsePreferredEmployees(props.value);
        setEmployees(parsedEmployees);
    }, [props.value]);

    // Get allocated employee IDs
    useEffect(() => {
        const ids = getAllocatedEmployeeIds();
        setAllocatedIds(ids);
    }, [allocatedEmployees]);

    // Function to get all allocated employee IDs
    const getAllocatedEmployeeIds = () => {
        const ids = new Set();
        Object.values(allocatedEmployees).forEach(employees => {
            employees.forEach(employee => ids.add(employee.id));
        });
        return ids;
    };

    // Get up to 4 non-allocated employees
    let availableEmployees = employees.filter(employee => !allocatedIds.has(employee.id));

    const numPlaceholders = Math.max(0, Math.min(4 - availableEmployees.length, 4));
    const placeholders = Array(numPlaceholders).fill({ isPlaceholder: true });

    // Create pairs of employees for the grid layout
    const createEmployeePairs = (employeeList) => {
        const pairs = [];
        for (let i = 0; i < employeeList.length; i += 2) {
            pairs.push(employeeList.slice(i, i + 2));
        }
        return pairs;
    };

    // Limit to only show first 4 available employees + any needed placeholders
    const displayItems = [...availableEmployees.slice(0, 4), ...placeholders].slice(0, 4);
    const employeePairs = createEmployeePairs(displayItems);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            width: '90%',
            margin: '16px',
            padding: '0', // No padding
            border: 'none', // No border
            marginTop: '-5px', // Move it more upward
            backgroundColor: 'transparent', // No background color
        }}>
            {employeePairs.map((pair, pairIndex) => (
                <div
                    key={`pair-${completeRowId}-${pairIndex}`}
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '4px',
                        width: '100%',
                        height: '22px'
                    }}
                >
                    {pair.map((item, idx) => (
                        <div
                            key={item.isPlaceholder ? `placeholder-${completeRowId}-${pairIndex}-${idx}` : `employee-${item.id}-${completeRowId}`}
                            style={{
                                flex: 1,
                                minWidth: '180px',
                                maxWidth: 'calc(40% - 2px)'
                            }}
                        >
                            {!item.isPlaceholder && (
                                <EmployeeDraggable
                                    employee={item}
                                    rowIdentifier={completeRowId}
                                />
                            )}
                        </div>
                    ))}
                    {pair.length === 1 && <div style={{ flex: 1, minWidth: '180px' }}></div>}
                </div>
            ))}
        </div>
    );
}

// Simplified final allocation renderer
function FinalAllocationRenderer(props) {
    const { allocatedEmployees, removeEmployee, isUpdating } = useDnd();
    const [localEmployee, setLocalEmployee] = useState(null);

    // Use row index as the unique identifier
    const rowId = props.node.id;

    // Get the Dday_ID from the row data for API calls
    const ddayId = props.data?.Dday_ID || '';

    // Construct a complete row identifier with Dday_ID
    const completeRowId = `${ddayId}-${rowId}`;

    // Get employees from the DnD context
    const dndEmployees = allocatedEmployees[rowId] || [];

    // Reset local state when Final_Allocation changes
    useEffect(() => {
        const finalAllocation = props.data?.Final_Allocation;

        // Clear local employee if Final_Allocation is empty
        if (!finalAllocation || finalAllocation === '-' || finalAllocation === 'null' || finalAllocation === null) {
            setLocalEmployee(null);
            return;
        }

        // Only set local employee if we don't have DnD employees
        if (dndEmployees.length === 0) {
            try {
                // Parse the allocation to create employee object
                const matches = finalAllocation.match(/(\d+)\s*-\s*([^(]+)\s*\(([^)]+)\)/);

                if (matches) {
                    const id = matches[1];
                    const name = matches[2].trim();
                    const line = matches[3].trim();

                    setLocalEmployee({
                        id,
                        name,
                        line,
                        rowIdentifier: completeRowId,
                        fromApi: true
                    });
                }
            } catch (error) {
                console.error("Error parsing Final_Allocation:", error);
                setLocalEmployee(null);
            }
        }
    }, [props.data?.Final_Allocation, dndEmployees.length, completeRowId]);

    // Clear local employee when DnD employees are added
    useEffect(() => {
        if (dndEmployees.length > 0) {
            setLocalEmployee(null);
        }
    }, [dndEmployees]);

    // Setup drop zone
    const { setNodeRef, isOver } = useDroppable({
        id: `allocation-${rowId}`
    });

    // Determine which employee to show
    const displayEmployees = dndEmployees.length > 0 ? dndEmployees : (localEmployee ? [localEmployee] : []);

    // Create a tooltip content with employee details
    const createTooltipContent = (employees) => {
        if (employees.length === 0) return "";

        return employees.map(employee =>
            `ID: ${employee.id}, Name: ${employee.name}, Line: ${employee.line}`
        ).join('\n');
    };

    const tooltipContent = createTooltipContent(displayEmployees);

    const handleRemove = async () => {
        // Clear local state immediately
        setLocalEmployee(null);

        // Then call the remove function
        await removeEmployee(completeRowId);
    };

    return (
        <div
            ref={setNodeRef}
            className={`
                min-h-[40px]
                w-full
                border-2
                ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                ${isUpdating ? 'bg-gray-100' : ''}
                rounded
                p-1
                flex flex-wrap gap-1
                relative
            `}
            title={tooltipContent}
            style={{
                maxHeight: '80px',
                overflow: 'auto',
                width: '25vh',
            }}
        >
            {/* Loading overlay */}
            {isUpdating && (
                <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
            )}

            {/* Show employees */}
            {displayEmployees.map(employee => (
                <div
                    key={employee.id}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-sm text-black font-satoshi"
                    style={{
                        maxWidth: '100%',
                        marginBottom: '2px'
                    }}
                >
                    <span
                        className="whitespace-normal break-words"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxHeight: '2.4em',
                            lineHeight: '1.2'
                        }}
                        title={`${employee.id} - ${employee.name} (${employee.line})`}
                    >
                        {employee.id} - {employee.name} ({employee.line})
                    </span>
                    <button
                        onClick={handleRemove}
                        className="ml-2 text-red-500 font-bold flex-shrink-0"
                        disabled={isUpdating}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}

export {
    DndProvider,
    PreferredEmployeesRenderer,
    FinalAllocationRenderer,
    useDnd,
    useDraggable
};