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

from pydantic import BaseModel, ConfigDict, Field, StrictBool
from typing import Any, ClassVar, Dict, List, Optional
from openapi_client.models.boost_get_boosts_request_query_status import BoostGetBoostsRequestQueryStatus
from openapi_client.models.boost_get_boosts_request_query_uri import BoostGetBoostsRequestQueryUri
from typing import Optional, Set
from typing_extensions import Self

class BoostGetBoostsRequestQuery(BaseModel):
    """
    BoostGetBoostsRequestQuery
    """ # noqa: E501
    uri: Optional[BoostGetBoostsRequestQueryUri] = None
    name: Optional[BoostGetBoostsRequestQueryUri] = None
    type: Optional[BoostGetBoostsRequestQueryUri] = None
    category: Optional[BoostGetBoostsRequestQueryUri] = None
    meta: Optional[Dict[str, BoostGetBoostsRequestQueryUri]] = None
    status: Optional[BoostGetBoostsRequestQueryStatus] = None
    auto_connect_recipients: Optional[StrictBool] = Field(default=None, alias="autoConnectRecipients")
    __properties: ClassVar[List[str]] = ["uri", "name", "type", "category", "meta", "status", "autoConnectRecipients"]

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
        """Create an instance of BoostGetBoostsRequestQuery from a JSON string"""
        return cls.from_dict(json.loads(json_str))

    def to_dict(self) -> Dict[str, Any]:
        """Return the dictionary representation of the model using alias.

        This has the following differences from calling pydantic's
        `self.model_dump(by_alias=True)`:

        * `None` is only added to the output dict for nullable fields that
          were set at model initialization. Other fields with value `None`
          are ignored.
        """
        excluded_fields: Set[str] = set([
        ])

        _dict = self.model_dump(
            by_alias=True,
            exclude=excluded_fields,
            exclude_none=True,
        )
        # override the default output from pydantic by calling `to_dict()` of uri
        if self.uri:
            _dict['uri'] = self.uri.to_dict()
        # override the default output from pydantic by calling `to_dict()` of name
        if self.name:
            _dict['name'] = self.name.to_dict()
        # override the default output from pydantic by calling `to_dict()` of type
        if self.type:
            _dict['type'] = self.type.to_dict()
        # override the default output from pydantic by calling `to_dict()` of category
        if self.category:
            _dict['category'] = self.category.to_dict()
        # override the default output from pydantic by calling `to_dict()` of each value in meta (dict)
        _field_dict = {}
        if self.meta:
            for _key_meta in self.meta:
                if self.meta[_key_meta]:
                    _field_dict[_key_meta] = self.meta[_key_meta].to_dict()
            _dict['meta'] = _field_dict
        # override the default output from pydantic by calling `to_dict()` of status
        if self.status:
            _dict['status'] = self.status.to_dict()
        return _dict

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        """Create an instance of BoostGetBoostsRequestQuery from a dict"""
        if obj is None:
            return None

        if not isinstance(obj, dict):
            return cls.model_validate(obj)

        _obj = cls.model_validate({
            "uri": BoostGetBoostsRequestQueryUri.from_dict(obj["uri"]) if obj.get("uri") is not None else None,
            "name": BoostGetBoostsRequestQueryUri.from_dict(obj["name"]) if obj.get("name") is not None else None,
            "type": BoostGetBoostsRequestQueryUri.from_dict(obj["type"]) if obj.get("type") is not None else None,
            "category": BoostGetBoostsRequestQueryUri.from_dict(obj["category"]) if obj.get("category") is not None else None,
            "meta": dict(
                (_k, BoostGetBoostsRequestQueryUri.from_dict(_v))
                for _k, _v in obj["meta"].items()
            )
            if obj.get("meta") is not None
            else None,
            "status": BoostGetBoostsRequestQueryStatus.from_dict(obj["status"]) if obj.get("status") is not None else None,
            "autoConnectRecipients": obj.get("autoConnectRecipients")
        })
        return _obj


