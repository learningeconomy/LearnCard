/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Confirmuploadsimple4Inputs */

const en_admintools_bulkimport_confirmuploadsimple4 = /** @type {(inputs: Admintools_Bulkimport_Confirmuploadsimple4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to upload {count} {boosts}?`)
};

const es_admintools_bulkimport_confirmuploadsimple4 = /** @type {(inputs: Admintools_Bulkimport_Confirmuploadsimple4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres subir {count} {boosts}?`)
};

const fr_admintools_bulkimport_confirmuploadsimple4 = /** @type {(inputs: Admintools_Bulkimport_Confirmuploadsimple4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir télécharger {count} {boosts} ?`)
};

const ar_admintools_bulkimport_confirmuploadsimple4 = /** @type {(inputs: Admintools_Bulkimport_Confirmuploadsimple4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to upload {count} {boosts}?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to upload {count} {boosts}?" |
*
* @param {Admintools_Bulkimport_Confirmuploadsimple4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_confirmuploadsimple4 = /** @type {((inputs?: Admintools_Bulkimport_Confirmuploadsimple4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Confirmuploadsimple4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_confirmuploadsimple4(inputs)
	if (locale === "es") return es_admintools_bulkimport_confirmuploadsimple4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_confirmuploadsimple4(inputs)
	return ar_admintools_bulkimport_confirmuploadsimple4(inputs)
});
export { admintools_bulkimport_confirmuploadsimple4 as "adminTools.bulkImport.confirmUploadSimple" }