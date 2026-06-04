/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Shareinsightswithteacher3Inputs */

const en_launchpad_actions_shareinsightswithteacher3 = /** @type {(inputs: Launchpad_Actions_Shareinsightswithteacher3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Insights with Teacher`)
};

const es_launchpad_actions_shareinsightswithteacher3 = /** @type {(inputs: Launchpad_Actions_Shareinsightswithteacher3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir información con el profesor`)
};

const de_launchpad_actions_shareinsightswithteacher3 = /** @type {(inputs: Launchpad_Actions_Shareinsightswithteacher3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einblicke mit Lehrer teilen`)
};

const ar_launchpad_actions_shareinsightswithteacher3 = /** @type {(inputs: Launchpad_Actions_Shareinsightswithteacher3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الرؤى مع المعلم`)
};

const fr_launchpad_actions_shareinsightswithteacher3 = /** @type {(inputs: Launchpad_Actions_Shareinsightswithteacher3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager les analyses avec l'enseignant`)
};

const ko_launchpad_actions_shareinsightswithteacher3 = /** @type {(inputs: Launchpad_Actions_Shareinsightswithteacher3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`교사와 인사이트 공유`)
};

/**
* | output |
* | --- |
* | "Share Insights with Teacher" |
*
* @param {Launchpad_Actions_Shareinsightswithteacher3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_shareinsightswithteacher3 = /** @type {((inputs?: Launchpad_Actions_Shareinsightswithteacher3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Shareinsightswithteacher3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_shareinsightswithteacher3(inputs)
	if (locale === "es") return es_launchpad_actions_shareinsightswithteacher3(inputs)
	if (locale === "de") return de_launchpad_actions_shareinsightswithteacher3(inputs)
	if (locale === "ar") return ar_launchpad_actions_shareinsightswithteacher3(inputs)
	if (locale === "fr") return fr_launchpad_actions_shareinsightswithteacher3(inputs)
	return ko_launchpad_actions_shareinsightswithteacher3(inputs)
});
export { launchpad_actions_shareinsightswithteacher3 as "launchpad.actions.shareInsightsWithTeacher" }