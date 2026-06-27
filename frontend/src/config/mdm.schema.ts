export interface MDMField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'checkbox' | 'color' | 'static-select' | 'dynamic-select';
  required?: boolean;
  isPrimary?: boolean;
  hiddenInForm?: boolean;
  options?: string[]; // for static-select
  endpoint?: string;  // for dynamic-select
}

export interface MDMSchema {
  title: string;
  tableName: string;
  primaryKey: string;
  fields: MDMField[];
}

export const mdmSchemas: Record<string, MDMSchema> = {
  mst_plant: {
    title: "Plant Master",
    tableName: "mst_plant",
    primaryKey: "plantId",
    fields: [
      { key: "plantId", label: "Plant ID", type: "text", isPrimary: true, hiddenInForm: true },
      { key: "plantCode", label: "Plant Code", type: "text", required: true },
      { key: "plantName", label: "Plant Name", type: "text", required: true },
      { key: "city", label: "City", type: "text" },
      { key: "isActive", label: "Active", type: "checkbox" }
    ]
  },
  mst_department: {
    title: "Department Master",
    tableName: "mst_department",
    primaryKey: "deptId",
    fields: [
      { key: "deptId", label: "Dept ID", type: "text", isPrimary: true, hiddenInForm: true },
      { key: "deptCode", label: "Dept Code", type: "text", required: true },
      { key: "deptName", label: "Department Name", type: "text", required: true },
      { key: "plantId", label: "Plant", type: "dynamic-select", endpoint: "/v1/masters/dropdowns/mst_plant", required: true },
      { key: "isActive", label: "Active", type: "checkbox" }
    ]
  },
  mst_machine_type: {
    title: "Machine Type Master",
    tableName: "mst_machine_type",
    primaryKey: "machineTypeId",
    fields: [
      { key: "machineTypeId", label: "Type ID", type: "text", isPrimary: true, hiddenInForm: true },
      { key: "typeCode", label: "Type Code", type: "text", required: true },
      { key: "typeName", label: "Type Name", type: "text", required: true },
      { key: "deptId", label: "Department", type: "dynamic-select", endpoint: "/v1/masters/dropdowns/mst_department", required: true },
      { key: "sortOrder", label: "Sort Order", type: "number" },
      { key: "isActive", label: "Active", type: "checkbox" }
    ]
  },
  mst_machine: {
    title: "Machine Master",
    tableName: "mst_machine",
    primaryKey: "machineId",
    fields: [
      { key: "machineId", label: "Machine ID", type: "text", isPrimary: true, hiddenInForm: true },
      { key: "machineCode", label: "Machine Code", type: "text", required: true },
      { key: "machineName", label: "Machine Name", type: "text", required: true },
      { key: "machineTypeId", label: "Machine Type", type: "dynamic-select", endpoint: "/v1/masters/dropdowns/mst_machine_type", required: true },
      { key: "plantId", label: "Plant", type: "dynamic-select", endpoint: "/v1/masters/dropdowns/mst_plant", required: true },
      { key: "criticality", label: "Criticality", type: "static-select", options: ["A-Critical", "B-Important", "C-General"] },
      { key: "serialNo", label: "Serial No", type: "text" },
      { key: "isActive", label: "Active", type: "checkbox" }
    ]
  },
  mst_machine_unit: {
    title: "Machine Unit Master",
    tableName: "mst_machine_unit",
    primaryKey: "unitId",
    fields: [
      { key: "unitId", label: "Unit ID", type: "text", isPrimary: true, hiddenInForm: true },
      { key: "unitCode", label: "Unit Code", type: "text", required: true },
      { key: "unitName", label: "Unit Name", type: "text", required: true },
      { key: "machineId", label: "Machine", type: "dynamic-select", endpoint: "/v1/masters/dropdowns/mst_machine", required: true },
      { key: "parentUnitId", label: "Parent Unit", type: "dynamic-select", endpoint: "/v1/masters/dropdowns/mst_machine_unit" },
      { key: "position", label: "Position", type: "number" },
      { key: "isActive", label: "Active", type: "checkbox" }
    ]
  },
  mst_employee: {
    title: "Employee Master",
    tableName: "mst_employee",
    primaryKey: "employeeId",
    fields: [
      { key: "employeeId", label: "Employee ID", type: "text", isPrimary: true, hiddenInForm: true },
      { key: "empCode", label: "Emp Code", type: "text", required: true },
      { key: "empName", label: "Employee Name", type: "text", required: true },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "designation", label: "Designation", type: "text" },
      { key: "isActive", label: "Active", type: "checkbox" }
    ]
  },
  mst_shift: {
    title: "Shift Master",
    tableName: "mst_shift",
    primaryKey: "shiftId",
    fields: [
      { key: "shiftId", label: "Shift ID", type: "text", isPrimary: true, hiddenInForm: true },
      { key: "shiftCode", label: "Shift Code", type: "text", required: true },
      { key: "shiftName", label: "Shift Name", type: "text", required: true },
      { key: "startTime", label: "Start Time", type: "text" },
      { key: "endTime", label: "End Time", type: "text" },
      { key: "isActive", label: "Active", type: "checkbox" }
    ]
  },
  mst_problem_type: {
    title: "Problem Type Master",
    tableName: "mst_problem_type",
    primaryKey: "problemTypeId",
    fields: [
      { key: "problemTypeId", label: "Problem Type ID", type: "text", isPrimary: true, hiddenInForm: true },
      { key: "typeCode", label: "Type Code", type: "text", required: true },
      { key: "typeName", label: "Problem Type Name", type: "text", required: true },
      { key: "colorCode", label: "Color Code", type: "color" },
      { key: "isActive", label: "Active", type: "checkbox" }
    ]
  },
  mst_wo_category: {
    title: "Work Order Category",
    tableName: "mst_wo_category",
    primaryKey: "categoryId",
    fields: [
      { key: "categoryId", label: "Category ID", type: "text", isPrimary: true, hiddenInForm: true },
      { key: "categoryCode", label: "Category Code", type: "text", required: true },
      { key: "categoryName", label: "Category Name", type: "text", required: true },
      { key: "isActive", label: "Active", type: "checkbox" }
    ]
  },
  mst_status: {
    title: "Status Master",
    tableName: "mst_status",
    primaryKey: "statusId",
    fields: [
      { key: "statusId", label: "Status ID", type: "text", isPrimary: true, hiddenInForm: true },
      { key: "statusCode", label: "Status Code", type: "text", required: true },
      { key: "statusName", label: "Status Name", type: "text", required: true },
      { key: "isActive", label: "Active", type: "checkbox" }
    ]
  },
  mst_priority: {
    title: "Priority Master",
    tableName: "mst_priority",
    primaryKey: "priorityId",
    fields: [
      { key: "priorityId", label: "Priority ID", type: "text", isPrimary: true, hiddenInForm: true },
      { key: "priorityCode", label: "Priority Code", type: "text", required: true },
      { key: "priorityName", label: "Priority Name", type: "text", required: true },
      { key: "level", label: "Level", type: "number" },
      { key: "isActive", label: "Active", type: "checkbox" }
    ]
  }
};
