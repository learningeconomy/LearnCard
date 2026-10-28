export const root = document.getElementById('app')!;
export const heading = (title: string): void => {
    root.replaceChildren();
    const label = document.createElement('p');
    label.className = 'eyebrow';
    label.textContent = 'LearnCard · Development lab';
    const h = document.createElement('h1');
    h.textContent = title;
    root.append(label, h);
};
export const text = (value: string, className = ''): HTMLElement => {
    const element = document.createElement('p');
    element.textContent = value;
    element.className = className;
    root.append(element);
    return element;
};
export const status = (value: string, error = false): void => {
    const node = document.getElementById('status') ?? text('', 'status');
    node.id = 'status';
    node.setAttribute('role', error ? 'alert' : 'status');
    node.className = error ? 'status error' : 'status';
    node.textContent = value;
};
export const button = (
    label: string,
    loading: string,
    action: () => Promise<void>,
    secondary = false
): HTMLButtonElement => {
    const element = document.createElement('button');
    element.textContent = label;
    if (secondary) element.className = 'secondary';
    element.onclick = async () => {
        element.disabled = true;
        element.textContent = loading;
        element.setAttribute('aria-busy', 'true');
        try {
            await action();
        } catch {
            status('Something went wrong. Please try again.', true);
        } finally {
            element.disabled = false;
            element.textContent = label;
            element.removeAttribute('aria-busy');
        }
    };
    root.append(element);
    return element;
};
