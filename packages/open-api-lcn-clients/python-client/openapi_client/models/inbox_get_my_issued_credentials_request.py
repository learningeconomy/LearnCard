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

from pydantic import BaseModel, ConfigDict, StrictFloat, StrictInt, StrictStr
from typing import Any, ClassVar, Dict, List, Optional, Union
from openapi_client.models.inbox_get_my_issued_credentials_request_query import InboxGetMyIssuedCredentialsRequestQuery
from openapi_client.models.inbox_issue200_response_recipient import InboxIssue200ResponseRecipient
from typing import Optional, Set
from typing_extensions import Self

class InboxGetMyIssuedCredentialsRequest(BaseModel):
    """
    InboxGetMyIssuedCredentialsRequest
    """ # noqa: E501
    limit: Optional[Union[StrictFloat, StrictInt]] = 25
    cursor: Optional[StrictStr] = None
    sort: Optional[StrictStr] = None
    query: Optional[InboxGetMyIssuedCredentialsRequestQuery] = None
    recipient: Optional[InboxIssue200ResponseRecipient] = None
    __properties: ClassVar[List[str]] = ["limit", "cursor", "sort", "query", "recipient"]

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
        """Create an instance of InboxGetMyIssuedCredentialsRequest from a JSON string"""
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
        # override the default output from pydantic by calling `to_dict()` of query
        if self.query:
            _dict['query'] = self.query.to_dict()
        # override the default output from pydantic by calling `to_dict()` of recipient
        if self.recipient:
            _dict['recipient'] = self.recipient.to_dict()
        return _dict

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        """Create an instance of InboxGetMyIssuedCredentialsRequest from a dict"""
        if obj is None:
            return None

        if not isinstance(obj, dict):
            return cls.model_validate(obj)

        _obj = cls.model_validate({
            "limit": obj.get("limit") if obj.get("limit") is not None else 25,
            "cursor": obj.get("cursor"),
            "sort": obj.get("sort"),
            "query": InboxGetMyIssuedCredentialsRequestQuery.from_dict(obj["query"]) if obj.get("query") is not None else None,
            "recipient": InboxIssue200ResponseRecipient.from_dict(obj["recipient"]) if obj.get("recipient") is not None else None
        })
        return _obj


