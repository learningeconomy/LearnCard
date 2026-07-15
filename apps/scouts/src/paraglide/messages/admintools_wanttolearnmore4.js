/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Wanttolearnmore4Inputs */

const en_admintools_wanttolearnmore4 = /** @type {(inputs: Admintools_Wanttolearnmore4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Want to learn more?`)
};

const es_admintools_wanttolearnmore4 = /** @type {(inputs: Admintools_Wanttolearnmore4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Quieres aprender más?`)
};

const fr_admintools_wanttolearnmore4 = /** @type {(inputs: Admintools_Wanttolearnmore4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous voulez en savoir plus ?`)
};

const ar_admintools_wanttolearnmore4 = /** @type {(inputs: Admintools_Wanttolearnmore4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Want to learn more?`)
};

/**
* | output |
* | --- |
* | "Want to learn more?" |
*
* @param {Admintools_Wanttolearnmore4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_wanttolearnmore4 = /** @type {((inputs?: Admintools_Wanttolearnmore4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Wanttolearnmore4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_wanttolearnmore4(inputs)
	if (locale === "es") return es_admintools_wanttolearnmore4(inputs)
	if (locale === "fr") return fr_admintools_wanttolearnmore4(inputs)
	return ar_admintools_wanttolearnmore4(inputs)
});
export { admintools_wanttolearnmore4 as "adminTools.wantToLearnMore" }