/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Menu_Editcontactcard2Inputs */

const en_profile_menu_editcontactcard2 = /** @type {(inputs: Profile_Menu_Editcontactcard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Contact Card`)
};

const es_profile_menu_editcontactcard2 = /** @type {(inputs: Profile_Menu_Editcontactcard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar tarjeta de contacto`)
};

const fr_profile_menu_editcontactcard2 = /** @type {(inputs: Profile_Menu_Editcontactcard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier la carte de contact`)
};

const ar_profile_menu_editcontactcard2 = /** @type {(inputs: Profile_Menu_Editcontactcard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل بطاقة الاتصال`)
};

/**
* | output |
* | --- |
* | "Edit Contact Card" |
*
* @param {Profile_Menu_Editcontactcard2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_menu_editcontactcard2 = /** @type {((inputs?: Profile_Menu_Editcontactcard2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Menu_Editcontactcard2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_menu_editcontactcard2(inputs)
	if (locale === "es") return es_profile_menu_editcontactcard2(inputs)
	if (locale === "fr") return fr_profile_menu_editcontactcard2(inputs)
	return ar_profile_menu_editcontactcard2(inputs)
});
export { profile_menu_editcontactcard2 as "profile.menu.editContactCard" }