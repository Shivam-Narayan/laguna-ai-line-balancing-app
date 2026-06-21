import React, { useState, createContext, useContext } from 'react';
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

// Create context for Planning Sheet DnD
const PlanningSheetDndContext = createContext();

// Provider component for Planning Sheet
const PlanningSheetDndProvider = ({ children, onDragEnd }) => {
    const [activeId, setActiveId] = useState(null);
    const [activeEmployee, setActiveEmployee] = useState(null);

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
        
        if (over && onDragEnd) {
            const employee = active.data.current?.employee;
            const operation = over.data.current?.operation;
            
            if (employee && operation) {
                await onDragEnd(employee, operation);
            }
        }
        
        setActiveId(null);
        setActiveEmployee(null);
    }

    const value = {
        activeId,
        activeEmployee
    };

    return (
        <PlanningSheetDndContext.Provider value={value}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {children}
                <DragOverlay>
                    {activeEmployee && (
                        <div className="bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded border border-blue-400 shadow-lg">
                            {activeEmployee.id}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </PlanningSheetDndContext.Provider>
    );
};

// Custom hook to access context
const usePlanningSheetDnd = () => useContext(PlanningSheetDndContext);

// Draggable Employee Component for Planning Sheet (shows only ID)
function PlanningSheetEmployeeDraggable({ employee, operationId }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `employee-${operationId}-${employee.id}`,
        data: { employee: employee }
    });

    const style = {
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex-1 text-center"
            title={`${employee.id} - ${employee.name}`}
        >
            {employee.id}
        </div>
    );
}

// Droppable Operator Info Component for Planning Sheet
function PlanningSheetDroppableOperatorInfo({ operation, children, showDropZone = false }) {
    const dropZoneId = operation.dropZoneId || 
                      `dropzone-${operation.manningId || operation.id}-${operation.rowType || 'single'}`;

    const { isOver, setNodeRef } = useDroppable({
        id: dropZoneId,
        data: { operation: operation },
        disabled: !showDropZone
    });

    const getDropZoneClass = () => {
        // If drop zone is disabled, just show normal styling
        if (!showDropZone) {
            return `w-full h-full flex items-center px-2`;
        }
        
        // Show drop zone styling
        // return `w-full h-full flex items-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 transition-colors min-h-[60px] ${
        //     isOver ? 'border-blue-400 bg-blue-50' : 'hover:border-gray-400 hover:bg-gray-100'
        // }`;
        return `w-full h-full flex items-center justify-center px-2 transition-colors min-h-[60px]`;
    };

    return (
        <div ref={setNodeRef} className={getDropZoneClass()}>
            {showDropZone && !isOver && (
                <button
                    disabled
                    className={`w-full h-16 px-2 border-2 border-dashed rounded text-xs leading-tight flex flex-col items-center justify-center transition-colors ${
                        isOver 
                            ? 'border-blue-400 bg-blue-50 text-blue-600' 
                            : 'border-gray-300 bg-gray-50 text-gray-400 hover:border-gray-400 hover:bg-gray-100'
                    }`}
                >
                    <div>Drop employee</div>
                    <div>here</div>
                </button>
            )}
            {(!showDropZone || isOver) && children}
        </div>
    );
}

// Preferred Employees Cell Renderer for Planning Sheet
function PlanningSheetPreferredEmployeesRenderer(props) {
    if (!props || !props.data || !props.data.preferredEmployees) {
        return <div className="flex justify-center h-full w-full">-</div>;
    }

    // Skip preferred employees for parent rows
    if (props.data.rowType === 'parent') {
        return <div className="flex justify-center h-full w-full">-</div>;
    }

    const preferredEmployees = props.data.preferredEmployees;

    if (!Array.isArray(preferredEmployees) || preferredEmployees.length === 0) {
        return <div className="flex justify-center h-full w-full">-</div>;
    }

    const employees = preferredEmployees.map(empObj => {
        const empId = Object.keys(empObj)[0];
        const empName = empObj[empId];
        return { id: empId, name: empName };
    });

    // Filter out employees who are already assigned to this operation
    const { Employee_ID } = props.data;
    const assignedEmployeeId = Employee_ID &&
        Employee_ID !== '-' &&
        Employee_ID !== 0 &&
        String(Employee_ID) !== '0' &&
        String(Employee_ID).toLowerCase() !== 'nan' &&
        String(Employee_ID).toLowerCase() !== 'undefined' &&
        String(Employee_ID).toLowerCase() !== 'null' &&
        String(Employee_ID).toLowerCase() !== 'invalid number'
        ? String(Employee_ID) : null;

    const availableEmployees = employees.filter(employee =>
        assignedEmployeeId === null || String(employee.id) !== assignedEmployeeId
    );

    if (availableEmployees.length === 0) {
        return <div className="flex justify-center h-full w-full">-</div>;
    }

    // Create unique operation identifier using more specific data
    const operationId = props.data.dropZoneId || 
                       `${props.data.id || props.data.manningId}-${props.data.rowType || 'single'}`;

    return (
        <div className="flex flex-wrap gap-1 p-1 w-full h-full items-start content-start overflow-hidden">
            {availableEmployees.map((employee, index) => (
                <PlanningSheetEmployeeDraggable
                    key={`${operationId}-${employee.id}-${index}`}
                    employee={employee}
                    operationId={operationId}
                />
            ))}
        </div>
    );
}

// Operator Info Cell Renderer for Planning Sheet
function PlanningSheetOperatorInfoRenderer(props) {
    const { onRemoveEmployee } = props.colDef.cellRendererParams || {};

    if (!props || !props.data) {
        return <PlanningSheetDroppableOperatorInfo operation={{}} showDropZone={false}><span>-</span></PlanningSheetDroppableOperatorInfo>;
    }

    // Skip operator info for parent rows
    if (props.data.rowType === 'parent') {
        return <span>-</span>;
    }

    const { Employee_ID, operatorName } = props.data;
    const pendingEmployee = props.pendingEmployee; 

    const isValidEmpId = Employee_ID &&
        Employee_ID !== '-' &&
        Employee_ID !== 0 &&
        String(Employee_ID) !== '0' &&
        String(Employee_ID).toLowerCase() !== 'nan' &&
        String(Employee_ID).toLowerCase() !== 'undefined' &&
        String(Employee_ID).toLowerCase() !== 'null' &&
        String(Employee_ID).toLowerCase() !== 'invalid number';

    const isValidOperatorName = operatorName && operatorName !== '-';

    // Check if operator is already allocated
    const isAllocated = isValidEmpId || isValidOperatorName;

   const shouldShowDropZone = !isAllocated && !pendingEmployee;

    let displayContent;
    
    if (pendingEmployee) {
        // Show the pending employee info in a styled box
        displayContent = (
            <div className="w-full h-full flex items-center justify-center px-2">
                <div className="bg-green-50 border border-green-200 rounded px-2 py-2 text-center w-full">
                    <div className="text-xs font-medium text-green-700 leading-tight">
                        Employee: {pendingEmployee.id}
                    </div>
                    <div className="text-xs text-green-600 leading-tight">
                        {pendingEmployee.name}
                    </div>
                </div>
            </div>
        );
    } else if (isValidEmpId && isValidOperatorName) {
        displayContent = <span style={{ width: '100%', display: 'block' }}>{`${Employee_ID} - ${operatorName}`}</span>;
    } else if (isValidOperatorName) {
        displayContent = <span style={{ width: '100%', display: 'block' }}>{operatorName}</span>;
    } else if (isValidEmpId) {
        displayContent = <span style={{ width: '100%', display: 'block' }}>{String(Employee_ID)}</span>;
    } else {
        displayContent = <span style={{ width: '100%', display: 'block' }}>-</span>;
    }

    return (
        <PlanningSheetDroppableOperatorInfo 
            operation={props.data} 
            showDropZone={shouldShowDropZone}
        >
            {displayContent}
        </PlanningSheetDroppableOperatorInfo>
    );
}

// Bulletproof Row ID Generator for Planning Sheet
function createPlanningSheetRowIdGenerator() {
    let uniqueCounter = 0;
    const rowIndexMap = new Map();
    const nodeInstanceMap = new WeakMap();

    return function generateUniqueId(params) {
        // Handle grouped/parent rows
        if (params.data?.rowType === 'parent') {
            return `parent-${params.data.style}`;
        }

        // Handle child rows
        if (params.data?.rowType === 'child') {
            return `child-${params.data.parentStyle}-${params.data.childIndex}`;
        }

        // Handle single rows
        if (params.data?.rowType === 'single') {
            return params.data.id || `single-${params.data.style}-${uniqueCounter++}`;
        }

        // For regular rows, use manningId if available
        if (params.data?.manningId) {
            return `manning-${params.data.manningId}`;
        }

        // Check if we've seen this node before
        if (params.node && nodeInstanceMap.has(params.node)) {
            return String(nodeInstanceMap.get(params.node));
        }

        // Check if we've seen this rowIndex before
        if (params.rowIndex !== undefined && params.rowIndex !== null &&
            rowIndexMap.has(params.rowIndex)) {
            const existingId = rowIndexMap.get(params.rowIndex);
            
            if (params.node) {
                nodeInstanceMap.set(params.node, existingId);
            }
            
            return String(existingId);
        }

        // Generate a new unique ID
        const prefix = params.rowIndex !== undefined ? `r${params.rowIndex}` : 'u';
        const timestamp = Date.now().toString().slice(-4);
        const randomSuffix = Math.random().toString(36).substring(2, 5);
        const uniqueId = `${prefix}-${uniqueCounter++}-${timestamp}-${randomSuffix}`;

        // Store for future reuse
        if (params.rowIndex !== undefined && params.rowIndex !== null) {
            rowIndexMap.set(params.rowIndex, uniqueId);
        }

        if (params.node) {
            nodeInstanceMap.set(params.node, uniqueId);
        }

        return uniqueId;
    };
}

export {
    PlanningSheetDndProvider,
    PlanningSheetPreferredEmployeesRenderer,
    PlanningSheetOperatorInfoRenderer,
    usePlanningSheetDnd,
    createPlanningSheetRowIdGenerator
};