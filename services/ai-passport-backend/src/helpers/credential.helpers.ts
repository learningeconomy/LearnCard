// obv3 spec

// https://purl.imsglobal.org/spec/vc/ob/vocab.html#source
// https://purl.imsglobal.org/spec/vc/ob/vocab.html#Profile
export type Source = {
    type: [string, ...string[]];
    id: string;
    name: string;
    description: string;
    url: string;
    image: string;
    address: {
        type: [string, ...string[]];
        addressLocality: string;
        addressRegion: string;
        addressCountry: string;
    };
    // otherIdentifier: {
    //   type: string[];
    //   identifier: string;
    //   identifierType: string;
    // }[];
    // parentOrg: {
    //   type: string[];
    //   name: string;
    //   url: string;
    // };
};

// https://purl.imsglobal.org/spec/vc/ob/vocab.html#achievementsubject
export type Alignment = {
    type: [string, ...string[]];
    targetName: string; // https://purl.imsglobal.org/spec/vc/ob/vocab.html#targetName
    targetType: string; // https://purl.imsglobal.org/spec/vc/ob/vocab.html#targetType
    targetFramework: string; // https://purl.imsglobal.org/spec/vc/ob/vocab.html#targetFramework
    targetUrl: string;
};

// https://purl.imsglobal.org/spec/vc/ob/vocab.html#evidence
export type Evidence = {
    id: string;
    type: [string, ...string[]];
    name: string;
    description?: string;
    genre: string;
    audience: string;
};
