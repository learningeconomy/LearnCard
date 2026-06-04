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

const de_issue_actions = /** @type {(inputs: Issue_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aktionen`)
};

const ar_issue_actions = /** @type {(inputs: Issue_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإجراءات`)
};

const fr_issue_actions = /** @type {(inputs: Issue_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actions`)
};

const ko_issue_actions = /** @type {(inputs: Issue_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`작업`)
};

/**
* | output |
* | --- |
* | "Actions" |
*
* @param {Issue_ActionsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_actions = /** @type {((inputs?: Issue_ActionsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_ActionsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_actions(inputs)
	if (locale === "es") return es_issue_actions(inputs)
	if (locale === "de") return de_issue_actions(inputs)
	if (locale === "ar") return ar_issue_actions(inputs)
	if (locale === "fr") return fr_issue_actions(inputs)
	return ko_issue_actions(inputs)
});
export { issue_actions as "issue.actions" }