/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Selectnationalnetwork4Inputs */

const en_admintools_bulkimport_selectnationalnetwork4 = /** @type {(inputs: Admintools_Bulkimport_Selectnationalnetwork4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`5. Select the National Network that these Merit Badges and Social Boosts are for`)
};

const es_admintools_bulkimport_selectnationalnetwork4 = /** @type {(inputs: Admintools_Bulkimport_Selectnationalnetwork4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`5. Selecciona la Red Nacional a la que pertenecen estas Insignias de Mérito y Boosts Sociales`)
};

const fr_admintools_bulkimport_selectnationalnetwork4 = /** @type {(inputs: Admintools_Bulkimport_Selectnationalnetwork4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`5. Sélectionnez le réseau national auquel ces badges de mérite et Boosts sociaux sont destinés`)
};

const ar_admintools_bulkimport_selectnationalnetwork4 = /** @type {(inputs: Admintools_Bulkimport_Selectnationalnetwork4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`5. اختر الشبكة الوطنية التي تخصها هذه الشارات والتعزيزات الاجتماعية`)
};

/**
* | output |
* | --- |
* | "5. Select the National Network that these Merit Badges and Social Boosts are for" |
*
* @param {Admintools_Bulkimport_Selectnationalnetwork4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_selectnationalnetwork4 = /** @type {((inputs?: Admintools_Bulkimport_Selectnationalnetwork4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Selectnationalnetwork4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_selectnationalnetwork4(inputs)
	if (locale === "es") return es_admintools_bulkimport_selectnationalnetwork4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_selectnationalnetwork4(inputs)
	return ar_admintools_bulkimport_selectnationalnetwork4(inputs)
});
export { admintools_bulkimport_selectnationalnetwork4 as "adminTools.bulkImport.selectNationalNetwork" }