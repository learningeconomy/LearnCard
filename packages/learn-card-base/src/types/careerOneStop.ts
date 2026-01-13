export type CareerOneStopOccupation = {
    occupationDescription: string;
    OnetCode: string;
    OnetTitle: string;
};

export type OccupationDetailsOptions = {
    occupationDescription: string;
    OnetCode: string;
    OnetTitle: string;
    training?: boolean;
    interest?: boolean;
    videos?: boolean;
    tasks?: boolean;
    dwas?: boolean;
    wages?: boolean;
    alternateOnetTitles?: boolean;
    projectedEmployment?: boolean;
    ooh?: boolean;
    stateLMILinks?: boolean;
    relatedOnetTitles?: boolean;
    skills?: boolean;
    knowledge?: boolean;
    ability?: boolean;
    trainingPrograms?: boolean;
    industryEmpPattern?: boolean;
    toolsAndTechnology?: boolean;
    workValues?: boolean;
    enableMetaData?: boolean;
};

/* ---------------------------------------------
 * Root Response
 * --------------------------------------------- */

export interface OccupationDetailsResponse {
    OnetTitle: string;
    OnetCode: string;
    OnetDescription: string;

    Wages: Wages;

    BrightOutlook: 'Bright' | 'Average' | 'Below Average' | string;
    BrightOutlookCategory: string | null;
    Green: 'Yes' | 'No';

    COSVideoURL: string | null;

    EducationTraining: EducationTraining;

    Tasks: TaskItem[];
    Dwas: DwaItem[];

    AlternateTitles: string[] | null;
    RelatedOnetTitles: Record<string, string> | null;

    StFips: string;
    Location: string;

    Video: VideoItem[] | null;

    InterestDataList: ElementScore[] | null;
    SkillsDataList: ElementScore[] | null;
    KnowledgeDataList: ElementScore[] | null;
    AbilityDataList: ElementScore[] | null;

    SocInfo: SocInfo;
    Projections: Projections;

    TrainingPrograms: string[] | null;

    ToolsAndTechOccupationDetails: ToolsAndTechnologyDetails | null;

    WorkValuesOccupationDetails?: WorkValuesOccupationDetails;
}

export interface Wages {
    NationalWagesList: WageItem[];
    StateWagesList: WageItem[];
    BLSAreaWagesList: WageItem[];

    WageYear: string;
    SocData: 'Yes' | 'No';

    SocWageInfo: {
        SocCode: string;
        SocTitle: string;
        SocDescription: string | null;
    };
}

export interface WageItem {
    RateType: 'Hourly' | 'Annual';
    Pct10: string;
    Pct25: string;
    Median: string;
    Pct75: string;
    Pct90: string;
    StFips: string;
    Area: string;
    AreaName: string;
}

export interface EducationTraining {
    EducationType: {
        EducationLevel: string;
        Value: string;
    }[];

    EducationCode: string;
    EducationTitle: string;

    ExperienceCode: string;
    ExperienceTitle: string;

    TrainingCode: string;
    TrainingTitle: string;

    OccupationTitle: string;

    MatOccupation: {
        MatOccCode: string;
        MatOccTitle: string;
    };
}

export interface TaskItem {
    TaskDescription: string;
    TaskId: string;
    DataValue: string;
}

export interface DwaItem {
    DwaTitle: string;
    DwaId: string;
    DataValue: string;
    TaskId: string;
}

export interface ElementScore {
    ElementId: string;
    ElementName: string;
    ElementDescription: string;
    DataValue: string;
    Importance: string | null;
}

export interface SocInfo {
    SocCode: string;
    SocTitle: string;
    SocDescription: string;
}

export interface Projections {
    EstimatedYear: string;
    ProjectedYear: string;
    OccupationTitle: string;

    Projections: EmploymentProjection[];
    IndustryOccEmplt: IndustryEmployment[];
}

export interface EmploymentProjection {
    StateName: string;
    Stfips: string;
    EstimatedEmployment: string;
    ProjectedEmployment: string;
    PerCentChange: string;
    ProjectedAnnualJobOpening: string;
    EstimatedYear: string;
    ProjectedYear: string;
}

export interface IndustryEmployment {
    Industry: string;
    Pctestocc: number;
    MatInCode: string;
    PercentChange: number;
    EstimatedEmployment: number;
    NumberChanged: number;
    ProjectEmployment: number;
    IagCode: string;
}
export interface ToolsAndTechnologyDetails {
    OnetCode: string | null;
    OnetTitle: string | null;

    Tools: {
        Categories: ToolCategory[];
    };

    Technology: {
        CategoryList: TechnologyCategory[];
    };
}

export interface ToolCategory {
    Title: string;
    Examples: ToolExample[];
}

export interface ToolExample {
    Name: string;
    Hot_Technology?: 'Y' | 'N' | '';
    In_Demand?: 'Y' | 'N' | '';
}

export interface TechnologyCategory {
    Title: string;
    Examples: TechnologyExample[];
}

export interface TechnologyExample {
    Name: string;
    Hot_Technology: 'Y' | 'N';
    In_Demand: 'Y' | 'N';
}

export interface VideoItem {
    VideoCode: string;
    VideoTitle: string;
    VideoType: string;
}

export interface WorkValuesOccupationDetails {
    WorkValue: string;
    Characteristics: string[];
}

// salaries
export type CareerOneStopLocationSalary = {
    RateType: 'Hourly' | 'Annual';
    Pct10: string;
    Pct25: string;
    Median: string;
    Pct75: string;
    Pct90: string;
    StFips: string;
    Area: string;
    AreaName: string;
};

export type CareerOneStopSocInfo = {
    SocCode: string;
    SocTitle: string;
    SocDescription: string;
};

export type CareerOneStopOccupationRequest = {
    InputOccupation: string;
    InputOccupationCode: string;
    InputOccupationTitle: string;
};

export type CareerOneStopSalariesOccupation = {
    Code: string;
    Title: string;
    Request: CareerOneStopOccupationRequest;
    WageInfo: CareerOneStopLocationSalary[];
    SocInfo: CareerOneStopSocInfo;
};

export type CareerOneStopLocationResult = {
    LocationName: string;
    InputLocation: string;
    OccupationList: CareerOneStopSalariesOccupation[];
};

// training programs
export type ProgramLength = {
    Name: string; // e.g. "4 years"
    Value: string; // e.g. "4 years"
};

export type TrainingOccupation = {
    Name: string; // e.g. "Software Developers"
    Value: string; // e.g. "Software Developers"
};

export type TrainingProgram = {
    ID: string;
    SchoolName: string;
    SchoolUrl: string;
    Address: string;
    City: string;
    StateAbbr: string;
    StateName: string;
    Zip: string;
    Phone: string;
    Distance: number | null;
    Region: string;
    RegionCode: string;
    TotalEnrollment: number | null;
    ProgramName: string;
    StudentGraduated: string;
    ElementID: string;
    ProgramLength: ProgramLength[];
    Occupationslist: TrainingOccupation[];
};
