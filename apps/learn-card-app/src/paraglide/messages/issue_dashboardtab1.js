/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_Dashboardtab1Inputs */

const en_issue_dashboardtab1 = /** @type {(inputs: Issue_Dashboardtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dashboard`)
};

const es_issue_dashboardtab1 = /** @type {(inputs: Issue_Dashboardtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Panel`)
};

const fr_issue_dashboardtab1 = /** @type {(inputs: Issue_Dashboardtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tableau de bord`)
};

const ar_issue_dashboardtab1 = /** @type {(inputs: Issue_Dashboardtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لوحة التحكم`)
};

/**
* | output |
* | --- |
* | "Dashboard" |
*
* @param {Issue_Dashboardtab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_dashboardtab1 = /** @type {((inputs?: Issue_Dashboardtab1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Dashboardtab1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_dashboardtab1(inputs)
	if (locale === "es") return es_issue_dashboardtab1(inputs)
	if (locale === "fr") return fr_issue_dashboardtab1(inputs)
	return ar_issue_dashboardtab1(inputs)
});
export { issue_dashboardtab1 as "issue.dashboardTab" }