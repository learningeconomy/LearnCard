/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Adminpanel_Createframework2Inputs */

const en_skills_adminpanel_createframework2 = /** @type {(inputs: Skills_Adminpanel_Createframework2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Framework`)
};

const es_skills_adminpanel_createframework2 = /** @type {(inputs: Skills_Adminpanel_Createframework2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear marco`)
};

const fr_skills_adminpanel_createframework2 = /** @type {(inputs: Skills_Adminpanel_Createframework2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un référentiel`)
};

const ar_skills_adminpanel_createframework2 = /** @type {(inputs: Skills_Adminpanel_Createframework2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء إطار`)
};

/**
* | output |
* | --- |
* | "Create Framework" |
*
* @param {Skills_Adminpanel_Createframework2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_adminpanel_createframework2 = /** @type {((inputs?: Skills_Adminpanel_Createframework2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Adminpanel_Createframework2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_adminpanel_createframework2(inputs)
	if (locale === "es") return es_skills_adminpanel_createframework2(inputs)
	if (locale === "fr") return fr_skills_adminpanel_createframework2(inputs)
	return ar_skills_adminpanel_createframework2(inputs)
});
export { skills_adminpanel_createframework2 as "skills.adminPanel.createFramework" }