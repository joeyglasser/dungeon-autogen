import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { generateMap, addAsset, setResolution } from "./mapSlice";
import { useMediaQuery } from "react-responsive";

import Accordion from "react-bootstrap/Accordion";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";

export const Control = () => {
  const dispatch = useDispatch();
  const width = useSelector((state) => state.map.width);
  const height = useSelector((state) => state.map.height);
  const size = useSelector((state) => state.map.size);
  const navigationWidth = useSelector((state) => state.map.navigationWidth);
  const assetLinks = useSelector((state) => state.map.mapData);
  const smallWidth = useMediaQuery({ query: "(max-width: 1224px)" });
  const portrait = useMediaQuery({ query: "orientation: portrait" });
  const isMobile = smallWidth || portrait;

  return (
    <div
      className={isMobile ? "bottomnav" : "sidenav"}
      style={isMobile ? { width: "100%" } : { width: `${navigationWidth}px` }}
    >
      <Accordion defaultActiveKey="0" flush alwaysOpen>
        <Accordion.Item eventKey="0">
          <Accordion.Header>Configuration</Accordion.Header>
          <Accordion.Body>
            <Form>
              <Form.Group as={Row}>
                <Form.Label column sm={3}>
                  Width
                </Form.Label>
                <Col sm={9}>
                  <Form.Control
                    id="width_input"
                    type="number"
                    defaultValue={width}
                    min="1"
                    max="150"
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row}>
                <Form.Label column sm={3}>
                  Height
                </Form.Label>
                <Col sm={9}>
                  <Form.Control
                    id="height_input"
                    type="number"
                    defaultValue={height}
                    min="1"
                    max="150"
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row}>
                <Form.Label column sm={3}>
                  Padding
                </Form.Label>
                <Col sm={9}>
                  <Form.Control
                    id="padding_input"
                    type="number"
                    defaultValue={1}
                    min="0"
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row}>
                <Form.Label column sm={3}>
                  Room Count
                </Form.Label>
                <Col sm={9}>
                  <Form.Control
                    id="room_count_input"
                    type="number"
                    defaultValue={20}
                    min="1"
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row}>
                <Form.Label column sm={3}>
                  Room Sparsity
                </Form.Label>
                <Col sm={9}>
                  <Form.Range
                    defaultValue={2}
                    step="0.01"
                    id="sparsity_input"
                    min="1"
                    max="5"
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row}>
                <Form.Label column sm={3}>
                  Resolution
                </Form.Label>
                <Col sm={9}>
                  <Form.Range
                    // type="range"
                    defaultValue={size}
                    min="1"
                    max="75"
                    onMouseUp={(e) =>
                      dispatch(setResolution(parseInt(e.target.value)))
                    }
                    onTouchEnd={(e) =>
                      dispatch(setResolution(parseInt(e.target.value)))
                    }
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row}>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch(
                      generateMap(
                        parseInt(document.getElementById("width_input").value),
                        parseInt(document.getElementById("height_input").value),
                        parseInt(
                          document.getElementById("padding_input").value
                        ),
                        parseInt(
                          document.getElementById("room_count_input").value
                        ),
                        parseFloat(
                          document.getElementById("sparsity_input").value
                        )
                      )
                    );
                  }}
                >
                  {" "}
                  Generate
                </Button>
              </Form.Group>
            </Form>
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="1">
          <Accordion.Header>Asset Upload</Accordion.Header>
          <Accordion.Body>
            <Form>
              <Form.Group as={Row}>
                <Form.Label column sm={3}>
                  Flooring
                </Form.Label>
              </Form.Group>
              <Form.Group as={Row}>
                <Form.Control
                  type="file"
                  accept="image/png, image/jpeg"
                  onInput={(e) => {
                    const file = e.target.files[0];
                    const imageURL = URL.createObjectURL(file);
                    if (file) {
                      dispatch(
                        addAsset({
                          assetName: "flooring",
                          imageURL: imageURL,
                        })
                      );
                    }
                  }}
                ></Form.Control>
              </Form.Group>

              <Form.Group as={Row}>
                <Form.Label column sm={3}>
                  Background
                </Form.Label>
              </Form.Group>
              <Form.Group as={Row}>
                <Form.Control
                  type="file"
                  accept="image/png, image/jpeg"
                  onInput={(e) => {
                    const file = e.target.files[0];
                    const imageURL = URL.createObjectURL(file);
                    if (file) {
                      dispatch(
                        addAsset({
                          assetName: "background",
                          imageURL: imageURL,
                        })
                      );
                    }
                  }}
                ></Form.Control>
              </Form.Group>
            </Form>
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="2">
          <Accordion.Header>Export</Accordion.Header>
          <Accordion.Body>
            <Button
              onClick={async (e) => {
                e.preventDefault();
                var link = document.createElement("a");
                link.download = `map_${width}x${height}_${new Date().toISOString()}.png`;
                link.href = assetLinks["image"];
                console.log({ assetLinks });
                link.click();
              }}
            >
              PNG
            </Button>
            <Button
              onClick={async (e) => {
                e.preventDefault();

                var link = document.createElement("a");
                link.download = `map_${width}x${height}_${new Date().toISOString()}.dd2vtt`;
                link.href = assetLinks["dd2vtt"];
                link.click();
              }}
            >
              DD2VTT
            </Button>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};
