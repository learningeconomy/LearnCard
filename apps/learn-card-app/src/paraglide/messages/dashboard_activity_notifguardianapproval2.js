/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_Notifguardianapproval2Inputs */

const en_dashboard_activity_notifguardianapproval2 = /** @type {(inputs: Dashboard_Activity_Notifguardianapproval2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardian approval needed`)
};

const es_dashboard_activity_notifguardianapproval2 = /** @type {(inputs: Dashboard_Activity_Notifguardianapproval2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se requiere aprobación del tutor`)
};

const fr_dashboard_activity_notifguardianapproval2 = /** @type {(inputs: Dashboard_Activity_Notifguardianapproval2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approbation du tuteur requise`)
};

const ar_dashboard_activity_notifguardianapproval2 = /** @type {(inputs: Dashboard_Activity_Notifguardianapproval2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطلوب موافقة ولي الأمر`)
};

/**
* | output |
* | --- |
* | "Guardian approval needed" |
*
* @param {Dashboard_Activity_Notifguardianapproval2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_notifguardianapproval2 = /** @type {((inputs?: Dashboard_Activity_Notifguardianapproval2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Notifguardianapproval2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_notifguardianapproval2(inputs)
	if (locale === "es") return es_dashboard_activity_notifguardianapproval2(inputs)
	if (locale === "fr") return fr_dashboard_activity_notifguardianapproval2(inputs)
	return ar_dashboard_activity_notifguardianapproval2(inputs)
});
export { dashboard_activity_notifguardianapproval2 as "dashboard.activity.notifGuardianApproval" }