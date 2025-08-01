# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


from __future__ import annotations
import pprint
import re  # noqa: F401
import json

from pydantic import BaseModel, ConfigDict, Field, StrictStr
from typing import Any, ClassVar, Dict, List, Optional
from openapi_client.models.boost_send_boost_request_credential_any_of_context_inner import BoostSendBoostRequestCredentialAnyOfContextInner
from openapi_client.models.boost_send_boost_request_credential_any_of_issuer_any_of_type import BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType
from openapi_client.models.boost_send_boost_request_credential_any_of_proof import BoostSendBoostRequestCredentialAnyOfProof
from openapi_client.models.presentation_send_presentation_request_presentation_any_of_verifiable_credential import PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential
from typing import Optional, Set
from typing_extensions import Self

class PresentationSendPresentationRequestPresentationAnyOf(BaseModel):
    """
    PresentationSendPresentationRequestPresentationAnyOf
    """ # noqa: E501
    context: List[BoostSendBoostRequestCredentialAnyOfContextInner] = Field(alias="@context")
    id: Optional[StrictStr] = None
    type: BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType
    verifiable_credential: Optional[PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential] = Field(default=None, alias="verifiableCredential")
    holder: Optional[StrictStr] = None
    proof: BoostSendBoostRequestCredentialAnyOfProof
    additional_properties: Dict[str, Any] = {}
    __properties: ClassVar[List[str]] = ["@context", "id", "type", "verifiableCredential", "holder", "proof"]

    model_config = ConfigDict(
        populate_by_name=True,
        validate_assignment=True,
        protected_namespaces=(),
    )


    def to_str(self) -> str:
        """Returns the string representation of the model using alias"""
        return pprint.pformat(self.model_dump(by_alias=True))

    def to_json(self) -> str:
        """Returns the JSON representation of the model using alias"""
        # TODO: pydantic v2: use .model_dump_json(by_alias=True, exclude_unset=True) instead
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, json_str: str) -> Optional[Self]:
        """Create an instance of PresentationSendPresentationRequestPresentationAnyOf from a JSON string"""
        return cls.from_dict(json.loads(json_str))

    def to_dict(self) -> Dict[str, Any]:
        """Return the dictionary representation of the model using alias.

        This has the following differences from calling pydantic's
        `self.model_dump(by_alias=True)`:

        * `None` is only added to the output dict for nullable fields that
          were set at model initialization. Other fields with value `None`
          are ignored.
        * Fields in `self.additional_properties` are added to the output dict.
        """
        excluded_fields: Set[str] = set([
            "additional_properties",
        ])

        _dict = self.model_dump(
            by_alias=True,
            exclude=excluded_fields,
            exclude_none=True,
        )
        # override the default output from pydantic by calling `to_dict()` of each item in context (list)
        _items = []
        if self.context:
            for _item_context in self.context:
                if _item_context:
                    _items.append(_item_context.to_dict())
            _dict['@context'] = _items
        # override the default output from pydantic by calling `to_dict()` of type
        if self.type:
            _dict['type'] = self.type.to_dict()
        # override the default output from pydantic by calling `to_dict()` of verifiable_credential
        if self.verifiable_credential:
            _dict['verifiableCredential'] = self.verifiable_credential.to_dict()
        # override the default output from pydantic by calling `to_dict()` of proof
        if self.proof:
            _dict['proof'] = self.proof.to_dict()
        # puts key-value pairs in additional_properties in the top level
        if self.additional_properties is not None:
            for _key, _value in self.additional_properties.items():
                _dict[_key] = _value

        return _dict

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        """Create an instance of PresentationSendPresentationRequestPresentationAnyOf from a dict"""
        if obj is None:
            return None

        if not isinstance(obj, dict):
            return cls.model_validate(obj)

        _obj = cls.model_validate({
            "@context": [BoostSendBoostRequestCredentialAnyOfContextInner.from_dict(_item) for _item in obj["@context"]] if obj.get("@context") is not None else None,
            "id": obj.get("id"),
            "type": BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType.from_dict(obj["type"]) if obj.get("type") is not None else None,
            "verifiableCredential": PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential.from_dict(obj["verifiableCredential"]) if obj.get("verifiableCredential") is not None else None,
            "holder": obj.get("holder"),
            "proof": BoostSendBoostRequestCredentialAnyOfProof.from_dict(obj["proof"]) if obj.get("proof") is not None else None
        })
        # store additional fields in additional_properties
        for _key in obj.keys():
            if _key not in cls.__properties:
                _obj.additional_properties[_key] = obj.get(_key)

        return _obj


