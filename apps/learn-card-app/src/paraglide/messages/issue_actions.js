/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_ActionsInputs */

const en_issue_actions = /** @type {(inputs: Issue_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actions`)
};

const es_issue_actions = /** @type {(inputs: Issue_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acciones`)
};

const fr_issue_actions = /** @type {(inputs: Issue_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actions`)
};

const ar_issue_actions = /** @type {(inputs: Issue_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإجراءات`)
};

/**
* | output |
* | --- |
* | "Actions" |
*
* @param {Issue_ActionsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_actions = /** @type {((inputs?: Issue_ActionsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_ActionsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_actions(inputs)
	if (locale === "es") return es_issue_actions(inputs)
	if (locale === "fr") return fr_issue_actions(inputs)
	return ar_issue_actions(inputs)
});
export { issue_actions as "issue.actions" }