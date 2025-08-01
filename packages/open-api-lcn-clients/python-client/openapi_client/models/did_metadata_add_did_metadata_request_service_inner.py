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
from openapi_client.models.boost_send_boost_request_credential_any_of_issuer_any_of_type import BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType
from openapi_client.models.did_metadata_add_did_metadata_request_service_inner_service_endpoint import DidMetadataAddDidMetadataRequestServiceInnerServiceEndpoint
from typing import Optional, Set
from typing_extensions import Self

class DidMetadataAddDidMetadataRequestServiceInner(BaseModel):
    """
    DidMetadataAddDidMetadataRequestServiceInner
    """ # noqa: E501
    id: StrictStr
    type: BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType
    service_endpoint: Optional[DidMetadataAddDidMetadataRequestServiceInnerServiceEndpoint] = Field(default=None, alias="serviceEndpoint")
    additional_properties: Dict[str, Any] = {}
    __properties: ClassVar[List[str]] = ["id", "type", "serviceEndpoint"]

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
        """Create an instance of DidMetadataAddDidMetadataRequestServiceInner from a JSON string"""
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
        # override the default output from pydantic by calling `to_dict()` of type
        if self.type:
            _dict['type'] = self.type.to_dict()
        # override the default output from pydantic by calling `to_dict()` of service_endpoint
        if self.service_endpoint:
            _dict['serviceEndpoint'] = self.service_endpoint.to_dict()
        # puts key-value pairs in additional_properties in the top level
        if self.additional_properties is not None:
            for _key, _value in self.additional_properties.items():
                _dict[_key] = _value

        return _dict

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        """Create an instance of DidMetadataAddDidMetadataRequestServiceInner from a dict"""
        if obj is None:
            return None

        if not isinstance(obj, dict):
            return cls.model_validate(obj)

        _obj = cls.model_validate({
            "id": obj.get("id"),
            "type": BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType.from_dict(obj["type"]) if obj.get("type") is not None else None,
            "serviceEndpoint": DidMetadataAddDidMetadataRequestServiceInnerServiceEndpoint.from_dict(obj["serviceEndpoint"]) if obj.get("serviceEndpoint") is not None else None
        })
        # store additional fields in additional_properties
        for _key in obj.keys():
            if _key not in cls.__properties:
                _obj.additional_properties[_key] = obj.get(_key)

        return _obj


