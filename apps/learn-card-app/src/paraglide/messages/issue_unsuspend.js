/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_UnsuspendInputs */

const en_issue_unsuspend = /** @type {(inputs: Issue_UnsuspendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unsuspend`)
};

const es_issue_unsuspend = /** @type {(inputs: Issue_UnsuspendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reactivar`)
};

const fr_issue_unsuspend = /** @type {(inputs: Issue_UnsuspendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réactiver`)
};

const ar_issue_unsuspend = /** @type {(inputs: Issue_UnsuspendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة تفعيل`)
};

/**
* | output |
* | --- |
* | "Unsuspend" |
*
* @param {Issue_UnsuspendInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_unsuspend = /** @type {((inputs?: Issue_UnsuspendInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_UnsuspendInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_unsuspend(inputs)
	if (locale === "es") return es_issue_unsuspend(inputs)
	if (locale === "fr") return fr_issue_unsuspend(inputs)
	return ar_issue_unsuspend(inputs)
});
export { issue_unsuspend as "issue.unsuspend" }