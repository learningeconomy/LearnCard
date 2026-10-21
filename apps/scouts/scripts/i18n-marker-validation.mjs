export const interpolationVariables = value =>
    [...String(value).matchAll(/\{\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}\}/g)].map(match => match[1]);

export const markupMarkers = value =>
    (String(value).match(/<\/?\d+\s*\/?>/g) ?? []).map(marker => marker.replace(/\s/g, '')).sort();

export const malformedInterpolations = value =>
    [...String(value).matchAll(/(?<!\{)\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}(?!\})/g)].map(
        match => match[1]
    );
