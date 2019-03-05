import React from 'react';
import * as THREE from 'three';
import classNames from 'classnames';
import Dropzone from 'react-dropzone';
import STLLoader from 'three-stl-loader';
const StlLoader = new STLLoader(THREE);
import OrbitControls from 'three-orbitcontrols';
import { toCSG, fromCSG } from 'three-2-csg';
import { saveAs } from 'file-saver';
import * as exportSTL from 'threejs-export-stl';

export default class Icon extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      event: null,
      xBool: false,
      xMax: 0,
      xStep: 0,
      xValue: 0,
      yBool: false,
      yMax: 0,
      yStep: 0,
      yValue: 0,
      zBool: false,
      zMax: 0,
      zStep: 0,
      zValue: 0
    };
    this.traslateX = 0;
    this.traslateY = 0;
    this.traslateZ = 0;
    this.geometrys = [];
    this.width = 500;
    this.height = 500;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(new THREE.Vector3());
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.renderer.setClearColor('#777777');
    this.renderer.setSize(this.width, this.height);
    this.material = new THREE.MeshPhongMaterial({ color: '#E93F81' });
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(6, 6, 6);
    this.scene.add(light);
  }
  componentDidMount() {
    this.mount.appendChild(this.renderer.domElement);
    this.renderer.render(this.scene, this.camera);
  }
  handleDrop = acceptedFiles => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const loader = new StlLoader();

        this.scene.remove(this.mesh);

        const geometry = new THREE.Geometry().fromBufferGeometry(
          loader.parse(reader.result)
        );

        this.geometrys.push(geometry);

        this.mesh = new THREE.Mesh(geometry, this.material);

        if (this.geometrys.length > 1) {
          const inputCsg1 = toCSG(
            new THREE.Mesh(this.geometrys[0], this.material)
          );
          const inputCsg2 = toCSG(
            new THREE.Mesh(this.geometrys[1], this.material)
          );

          const intersectionCsg = inputCsg1.intersect(inputCsg2);
          const subtractCsg1 = inputCsg1.subtract(intersectionCsg);
          const subtractCsg2 = inputCsg2.subtract(intersectionCsg);

          const subtractGeometry1 = fromCSG(subtractCsg1);
          const subtractGeometry2 = fromCSG(subtractCsg2);

          const subtractGeometry1Size = [
            subtractGeometry1.boundingBox.max.x -
              subtractGeometry1.boundingBox.min.x,
            subtractGeometry1.boundingBox.max.y -
              subtractGeometry1.boundingBox.min.y,
            subtractGeometry1.boundingBox.max.z -
              subtractGeometry1.boundingBox.min.z
          ];

          const subtractGeometry2Size = [
            subtractGeometry2.boundingBox.max.x -
              subtractGeometry2.boundingBox.min.x,
            subtractGeometry2.boundingBox.max.y -
              subtractGeometry2.boundingBox.min.y,
            subtractGeometry2.boundingBox.max.z -
              subtractGeometry2.boundingBox.min.z
          ];

          const geometry12dist = Math.sqrt(
            subtractGeometry1Size.reduce((prev, curr, index) => {
              return prev + Math.pow(curr - subtractGeometry2Size[index], 2);
            }, 0)
          );

          if (geometry12dist < 0.1) {
            const xLength =
              subtractGeometry2.boundingBox.max.x -
              subtractGeometry1.boundingBox.max.x;
            this.xPluMi = Math.sign(xLength);
            const yLength =
              subtractGeometry2.boundingBox.max.y -
              subtractGeometry1.boundingBox.max.y;
            this.yPluMi = Math.sign(yLength);
            const zLength =
              subtractGeometry2.boundingBox.max.z -
              subtractGeometry1.boundingBox.max.z;
            this.zPluMi = Math.sign(zLength);

            this.setState({
              event: 'movement',
              xBool: xLength < 0.01 ? false : true,
              xMax: Math.abs(xLength),
              xStep: Math.abs(xLength) / 100,
              yBool: yLength < 0.01 ? false : true,
              yMax: Math.abs(yLength),
              yStep: Math.abs(yLength) / 100,
              zBool: zLength < 0.01 ? false : true,
              zMax: Math.abs(zLength),
              zStep: Math.abs(zLength) / 100
            });
            this.subtractMesh = new THREE.Mesh(
              fromCSG(subtractCsg1),
              this.material
            );
            this.intersectionMesh = new THREE.Mesh(
              fromCSG(intersectionCsg),
              this.material
            );
            this.mesh = new THREE.Mesh(
              fromCSG(subtractCsg1.union(intersectionCsg)),
              this.material
            );
          } else {
            const intersectionGeometry = fromCSG(intersectionCsg);
            const geometry1 = fromCSG(toCSG(this.geometrys[0]));
            const geometry2 = fromCSG(toCSG(this.geometrys[1]));

            const geometry1Size = [
              geometry1.boundingBox.max.x - geometry1.boundingBox.min.x,
              geometry1.boundingBox.max.y - geometry1.boundingBox.min.y,
              geometry1.boundingBox.max.z - geometry1.boundingBox.min.z
            ];

            const intersectionGeometrySize = [
              intersectionGeometry.boundingBox.max.x -
                intersectionGeometry.boundingBox.min.x,
              intersectionGeometry.boundingBox.max.y -
                intersectionGeometry.boundingBox.min.y,
              intersectionGeometry.boundingBox.max.z -
                intersectionGeometry.boundingBox.min.z
            ];

            const intersectionGeometry1dist = Math.sqrt(
              intersectionGeometrySize.reduce((prev, curr, index) => {
                return prev + Math.pow(curr - geometry1Size[index], 2);
              }, 0)
            );

            const minGeometry =
              intersectionGeometry1dist < 0.01 ? geometry1 : geometry2;
            const maxGeometry =
              intersectionGeometry1dist < 0.01 ? geometry2 : geometry1;

            const maxGeometrySize = [
              maxGeometry.boundingBox.max.x - maxGeometry.boundingBox.min.x,
              maxGeometry.boundingBox.max.y - maxGeometry.boundingBox.min.y,
              maxGeometry.boundingBox.max.z - maxGeometry.boundingBox.min.z
            ];

            const maxIntersectionSizeSubtract = maxGeometrySize.map(
              (e, i) => e - intersectionGeometrySize[i]
            );

            if (
              maxIntersectionSizeSubtract.filter(e => Math.abs(e) > 0.1)
                .length === 1
            ) {
              this.setState({
                event: 'stretching',
                xBool: maxIntersectionSizeSubtract[0] < 0.01 ? false : true,
                xMax: 1,
                xStep: 1 / maxIntersectionSizeSubtract[0] / 10,
                yBool: maxIntersectionSizeSubtract[1] < 0.01 ? false : true,
                yMax: 1,
                yStep: 1 / maxIntersectionSizeSubtract[1] / 10,
                zBool: maxIntersectionSizeSubtract[2] < 0.01 ? false : true,
                zMax: 1,
                zStep: 1 / maxIntersectionSizeSubtract[2] / 10
              });

              const subtractCsg = toCSG(maxGeometry).subtract(
                toCSG(minGeometry)
              );
              const subtractGeometry = fromCSG(subtractCsg);

              this.subtractMesh = new THREE.Mesh(
                subtractGeometry,
                this.material
              );
              this.intersectionMesh = new THREE.Mesh(
                intersectionGeometry,
                this.material
              );
              this.mesh = new THREE.Mesh(
                fromCSG(intersectionCsg),
                this.material
              );
            } else {
            }
          }
        }

        this.scene.add(this.mesh);

        this.renderer.render(this.scene, this.camera);
      };
      reader.onabort = () => console.log('file reading was aborted');
      reader.onerror = () => console.log('file reading has failed');
      reader.readAsBinaryString(file);
    });
  };
  movementXChange = e => {
    const xDist = e.target.value - this.state.xValue;
    this.setState({
      xValue: e.target.value
    });
    this.scene.remove(this.mesh);
    this.scene.add(this.subtractMesh);
    this.scene.add(this.intersectionMesh);
    this.subtractMesh.translateX(this.xPluMi * xDist);
    this.renderer.render(this.scene, this.camera);

    this.scene.remove(this.subtractMesh);
    this.scene.remove(this.intersectionMesh);
    this.mesh = new THREE.Mesh(
      fromCSG(toCSG(this.subtractMesh).union(toCSG(this.intersectionMesh))),
      this.material
    );
    this.scene.add(this.mesh);
  };
  movementYChange = e => {
    const yDist = e.target.value - this.state.yValue;
    this.setState({
      yValue: e.target.value
    });
    this.scene.remove(this.mesh);
    this.scene.add(this.subtractMesh);
    this.scene.add(this.intersectionMesh);
    this.subtractMesh.translateY(this.yPluMi * yDist);
    this.renderer.render(this.scene, this.camera);

    this.scene.remove(this.subtractMesh);
    this.scene.remove(this.intersectionMesh);
    this.mesh = new THREE.Mesh(
      fromCSG(toCSG(this.subtractMesh).union(toCSG(this.intersectionMesh))),
      this.material
    );
    this.scene.add(this.mesh);
  };
  movementZChange = e => {
    const zDist = e.target.value - this.state.zValue;
    this.setState({
      zValue: e.target.value
    });
    this.scene.remove(this.mesh);
    this.scene.add(this.subtractMesh);
    this.scene.add(this.intersectionMesh);
    this.subtractMesh.translateZ(this.zPluMi * zDist);
    this.renderer.render(this.scene, this.camera);

    this.scene.remove(this.subtractMesh);
    this.scene.remove(this.intersectionMesh);
    this.mesh = new THREE.Mesh(
      fromCSG(toCSG(this.subtractMesh).union(toCSG(this.intersectionMesh))),
      this.material
    );
    this.scene.add(this.mesh);
  };

  stretchingXChange = e => {
    this.setState({
      xValue: e.target.value
    });
    this.scene.remove(this.mesh);
    this.scene.add(this.subtractMesh);
    this.scene.add(this.intersectionMesh);
    const xMax = 1 / (this.state.xStep * 10);
    this.subtractMesh.translateX(xMax * (e.target.value - 1) - this.traslateX);
    this.traslateX = xMax * (e.target.value - 1);
    this.subtractMesh.scale.set(e.target.value, 1, 1);
    this.renderer.render(this.scene, this.camera);

    this.scene.remove(this.subtractMesh);
    this.scene.remove(this.intersectionMesh);
    this.mesh = new THREE.Mesh(
      fromCSG(toCSG(this.subtractMesh).union(toCSG(this.intersectionMesh))),
      this.material
    );
    this.scene.add(this.mesh);
  };
  stretchingYChange = e => {
    this.setState({
      yValue: e.target.value
    });
    this.scene.remove(this.mesh);
    this.scene.add(this.subtractMesh);
    this.scene.add(this.intersectionMesh);
    const yMax = 1 / (this.state.yStep * 10);
    this.subtractMesh.translateX(yMax * (e.target.value - 1) - this.traslateY);
    this.traslateY = yMax * (e.target.value - 1);
    this.subtractMesh.scale.set(e.target.value, 1, 1);
    this.renderer.render(this.scene, this.camera);

    this.scene.remove(this.subtractMesh);
    this.scene.remove(this.intersectionMesh);
    this.mesh = new THREE.Mesh(
      fromCSG(toCSG(this.subtractMesh).union(toCSG(this.intersectionMesh))),
      this.material
    );
    this.scene.add(this.mesh);
  };
  stretchingZChange = e => {
    this.setState({
      zValue: e.target.value
    });
    this.scene.remove(this.mesh);
    this.scene.add(this.subtractMesh);
    this.scene.add(this.intersectionMesh);
    const zMax = 1 / (this.state.zStep * 10);
    this.subtractMesh.translateX(zMax * (e.target.value - 1) - this.traslateZ);
    this.traslateZ = zMax * (e.target.value - 1);
    this.subtractMesh.scale.set(e.target.value, 1, 1);
    this.renderer.render(this.scene, this.camera);

    this.scene.remove(this.subtractMesh);
    this.scene.remove(this.intersectionMesh);
    this.mesh = new THREE.Mesh(
      fromCSG(toCSG(this.subtractMesh).union(toCSG(this.intersectionMesh))),
      this.material
    );
    this.scene.add(this.mesh);
  };
  handleMouseMove = () => {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
  download = () => {
    const buffer = exportSTL.fromMesh(this.mesh);
    const blob = new Blob([buffer], { type: exportSTL.mimeType });
    saveAs(blob, 'cube.stl');
  };
  render() {
    return (
      <div>
        <Dropzone onDrop={this.handleDrop}>
          {({ getRootProps, getInputProps, isDragActive }) => {
            return (
              <div
                style={{
                  width: this.width,
                  height: 100,
                  backgroundColor: '#000',
                  color: '#fff'
                }}
                {...getRootProps()}
                className={classNames('dropzone', {
                  'dropzone--isActive': isDragActive
                })}
              >
                DropZone
                <input {...getInputProps()} />
              </div>
            );
          }}
        </Dropzone>
        <div
          onMouseMove={this.handleMouseMove}
          style={{ width: this.width, height: this.height }}
          ref={e => (this.mount = e)}
        />
        {(() => {
          if (this.state.event) {
            if (this.state.event === 'movement') {
              return (
                <div>
                  {this.state.xBool && (
                    <div>
                      x:
                      <input
                        type='range'
                        min={0}
                        max={this.state.xMax}
                        value={this.state.xValue}
                        step={this.state.xStep}
                        onChange={this.movementXChange}
                      />
                    </div>
                  )}
                  {this.state.yBool && (
                    <div>
                      y:
                      <input
                        type='range'
                        min={0}
                        max={this.state.yMax}
                        value={this.state.yValue}
                        step={this.state.yStep}
                        onChange={this.movementYChange}
                      />
                    </div>
                  )}
                  {this.state.yBool && (
                    <div>
                      z:
                      <input
                        type='range'
                        min={0}
                        max={this.state.zMax}
                        value={this.state.zValue}
                        step={this.state.zStep}
                        onChange={this.movementZChange}
                      />
                    </div>
                  )}
                </div>
              );
            } else if ((this.state.event = 'stretching')) {
              return (
                <div>
                  {this.state.xBool && (
                    <div>
                      x:
                      <input
                        type='range'
                        min={0.00000001}
                        max={this.state.xMax}
                        value={this.state.xValue}
                        step={this.state.xStep}
                        onChange={this.stretchingXChange}
                      />
                    </div>
                  )}
                  {this.state.yBool && (
                    <div>
                      y:
                      <input
                        type='range'
                        min={0.00000001}
                        max={this.state.yMax}
                        value={this.state.yValue}
                        step={this.state.yStep}
                        onChange={this.stretchingYChange}
                      />
                    </div>
                  )}
                  {this.state.yBool && (
                    <div>
                      z:
                      <input
                        type='range'
                        min={0.00000001}
                        max={this.state.zMax}
                        value={this.state.zValue}
                        step={this.state.zStep}
                        onChange={this.stretchingZChange}
                      />
                    </div>
                  )}
                </div>
              );
            }
          }
        })()}
        <div
          style={{
            border: '#000',
            textAlign: 'center',
            border: 'black solid 1px',
            width: 100
          }}
          onClick={this.download}
        >
          download
        </div>
      </div>
    );
  }
}
