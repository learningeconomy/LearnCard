/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Manageskillsframeworks2Inputs */

const en_launchpad_actions_manageskillsframeworks2 = /** @type {(inputs: Launchpad_Actions_Manageskillsframeworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage Skills Frameworks`)
};

const es_launchpad_actions_manageskillsframeworks2 = /** @type {(inputs: Launchpad_Actions_Manageskillsframeworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar marcos de habilidades`)
};

const fr_launchpad_actions_manageskillsframeworks2 = /** @type {(inputs: Launchpad_Actions_Manageskillsframeworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les cadres de compétences`)
};

const ar_launchpad_actions_manageskillsframeworks2 = /** @type {(inputs: Launchpad_Actions_Manageskillsframeworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة أطر المهارات`)
};

/**
* | output |
* | --- |
* | "Manage Skills Frameworks" |
*
* @param {Launchpad_Actions_Manageskillsframeworks2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_manageskillsframeworks2 = /** @type {((inputs?: Launchpad_Actions_Manageskillsframeworks2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Manageskillsframeworks2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_manageskillsframeworks2(inputs)
	if (locale === "es") return es_launchpad_actions_manageskillsframeworks2(inputs)
	if (locale === "fr") return fr_launchpad_actions_manageskillsframeworks2(inputs)
	return ar_launchpad_actions_manageskillsframeworks2(inputs)
});
export { launchpad_actions_manageskillsframeworks2 as "launchpad.actions.manageSkillsFrameworks" }